import { productsEquals } from 'vsf-utilities'

const Magento2Client = require('magento2-rest-client').Magento2Client;

const config = require('config')
const redis = require('../../lib/redis');
const redisClient = redis.getClient(config)
const countryMapper = require('../../lib/countrymapper')
const Ajv = require('ajv'); // json validator
const fs = require('fs');
const ajv = new Ajv(); // validator
const merge = require('lodash/merge')
const orderSchema = require('../../models/order.schema.js')
let orderSchemaExtension = {}
if (fs.existsSync('../../models/order.schema.extension.json')) {
  orderSchemaExtension = require('../../models/order.schema.extension.json')
}
const validate = ajv.compile(merge(orderSchema, orderSchemaExtension));

function isNumeric (val) {
  return Number(parseFloat(val)).toString() === val;
}

/**
 * Send single order to Magento Instance
 *
 * The Magento2 API: https://magento.stackexchange.com/questions/136028/magento-2-create-order-using-rest-api
 *
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param {Object} config global CLI configuration
 * @param {Function} done callback - @example done(new Error()) - to acknowledge problems
 */
function processSingleOrder (orderData, config, job, done, logger = console) {
  const TOTAL_STEPS = 4;
  const THREAD_ID = 'ORD:' + (job ? job.id : 1) + ' - '; // job id
  let currentStep = 1;

  /**
   * Internal function to compose Error object using messages about other errors.
   *
   * 'Error' constructor should contain one message object only.
   * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error)
   *
   * @param {string} message Main error message.
   * @param {string|array|object} errors Additional error message or error object or array of array objects.
   * @return {Error}
   */
  function composeError (message, errors) {
    if (typeof errors === 'string') {
      message = message + ' ' + errors;
    } else if (Array.isArray(errors)) {
      // case with array of validation errors (ajv.ErrorObject - node_modules/ajv/lib/ajv.d.ts)
      errors.forEach((item) => {
        const part = (typeof item === 'string') ? item : (item.message || '');
        message = (message + ' ' + part).trim();
      });
    } else if (errors && (errors.message || errors.errorMessage)) {
      // I don't know possible structure of an 'errors' in this case, so I take 'apiError()' from 'src/lib/util.js'
      // we should use debugger to inspect this case in more details and modify code.
      message = message + ' ' + (errors.message || errors.errorMessage);
    }
    return new Error(message.trim());
  }

  if (!validate(orderData)) { // schema validation of upcoming order
    logger.error(THREAD_ID + ' Order validation error!', validate.errors);
    done(composeError('Error while validating order object.', validate.errors));

    if (job) job.progress(currentStep++, TOTAL_STEPS);
    return;
  }
  let isThisAuthOrder = parseInt(orderData.user_id) > 0
  const userId = orderData.user_id

  let apiConfig = config.magento2.api
  if (orderData.store_code) {
    if (config.availableStores.indexOf(orderData.store_code) >= 0) {
      apiConfig = Object.assign({}, apiConfig, { url: apiConfig.url + '/' + orderData.store_code })
      console.log('> Store code', orderData.store_code)
    } else {
      logger.error('Invalid store code', orderData.store_code)
    }
  }
  const api = Magento2Client(apiConfig);

  logger.info('> Order Id', orderData.order_id)
  logger.info('> Is order authorized?', isThisAuthOrder)
  logger.info('> User Id', userId)

  let cartId = orderData.cart_id
  const cartIdPrepare = isThisAuthOrder ? api.cart.create(null, userId) : (cartId ? new Promise((resolve, reject) => {
    resolve(cartId)
  }) : api.cart.create(null))

  logger.info(THREAD_ID + '> Cart Id', cartId)

  const processCart = (result) => {
    cartId = result

    logger.info(THREAD_ID + '< Cart Id', cartId)

    // load current cart from the Magento to synchronize elements
    api.cart.pull(null, cartId, null, isThisAuthOrder).then((serverItems) => {
      const clientItems = orderData.products
      const syncPromises = []

      logger.info(THREAD_ID + '> Sync between clientItems', clientItems.map((item) => { return { sku: item.sku, qty: item.qty, server_item_id: item.server_item_id, product_option: item.product_option } }))
      logger.info(THREAD_ID + '> ... and serverItems', serverItems)

      for (const clientItem of clientItems) {
        const serverItem = serverItems.find(itm => productsEquals(itm, clientItem))
        if (!serverItem) {
          logger.info(THREAD_ID + '< No server item for ' + clientItem.sku)
          syncPromises.push(api.cart.update(null, cartId, { // use magento API
            sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
            qty: clientItem.qty,
            product_option: clientItem.product_option,
            quote_id: cartId
          }, isThisAuthOrder))
        } else if (serverItem.qty !== clientItem.qty) {
          logger.info(THREAD_ID + '< Wrong qty for ' + clientItem.sku, clientItem.qty, serverItem.qty)
          syncPromises.push(api.cart.update(null, cartId, { // use magento API
            sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
            qty: clientItem.qty,
            product_option: clientItem.product_option,
            item_id: serverItem.item_id,
            quote_id: cartId
          }, isThisAuthOrder))
        } else {
          logger.info(THREAD_ID + '< Server and client items synced for ' + clientItem.sku) // here we need just update local item_id
        }
      }

      for (const serverItem of serverItems) {
        if (serverItem) {
          const clientItem = clientItems.find(itm => productsEquals(itm, serverItem))
          if (!clientItem) {
            logger.info(THREAD_ID + '< No client item for ' + serverItem.sku + ', removing from server cart') // use magento API
            syncPromises.push(api.cart.delete(null, cartId, { // delete server side item if not present if client's cart
              sku: serverItem.sku,
              item_id: serverItem.item_id
            }, isThisAuthOrder))
          }
        }
      }

      Promise.all(syncPromises).then((results) => {
        if (job) job.progress(currentStep++, TOTAL_STEPS);
        logger.info(THREAD_ID + '< Server cart in sync')
        logger.debug(THREAD_ID + results)

        const billingAddr = orderData.addressInformation.billingAddress;
        const shippingAddr = orderData.addressInformation.shippingAddress;
        let mappedShippingRegion = 0
        let mappedBillingRegion = 0

        api.directory.countries().then((countryList) => {
          if (typeof shippingAddr !== 'undefined' && shippingAddr !== null) {
            if (shippingAddr.region_id > 0) {
              mappedShippingRegion = { regionId: shippingAddr.region_id, regionCode: shippingAddr.region_code }
            } else {
              mappedShippingRegion = countryMapper.mapCountryRegion(countryList, shippingAddr.country_id, shippingAddr.region_code ? shippingAddr.region_code : shippingAddr.region)
            }
          }

          if (billingAddr.region_id > 0) {
            mappedBillingRegion = { regionId: billingAddr.region_id, regionCode: billingAddr.region_code }
          } else {
            mappedBillingRegion = countryMapper.mapCountryRegion(countryList, billingAddr.country_id, billingAddr.region_code ? billingAddr.region_code : billingAddr.region)
          }

          const billingAddressInfo = { // sum up totals
            'address': {
              'countryId': billingAddr.country_id,
              'street': billingAddr.street,
              'telephone': billingAddr.telephone,
              'postcode': billingAddr.postcode,
              'city': billingAddr.city,
              'firstname': billingAddr.firstname,
              'lastname': billingAddr.lastname,
              'email': billingAddr.email,
              'regionCode': mappedBillingRegion.regionCode,
              'regionId': mappedBillingRegion.regionId,
              'company': billingAddr.company,
              'vatId': billingAddr.vat_id,
              'save_in_address_book': billingAddr.save_address
            }
          }

          const shippingAddressInfo = { // sum up totals
            'addressInformation': {
              'billingAddress': {
                'countryId': billingAddr.country_id,
                'street': billingAddr.street,
                'telephone': billingAddr.telephone,
                'postcode': billingAddr.postcode,
                'city': billingAddr.city,
                'firstname': billingAddr.firstname,
                'lastname': billingAddr.lastname,
                'email': billingAddr.email,
                'regionId': mappedBillingRegion.regionId,
                'regionCode': mappedBillingRegion.regionCode,
                'region': billingAddr.region,
                'company': billingAddr.company,
                'vatId': billingAddr.vat_id,
                'save_in_address_book': billingAddr.save_address
              },
              'shippingMethodCode': orderData.addressInformation.shipping_method_code,
              'shippingCarrierCode': orderData.addressInformation.shipping_carrier_code,
              'extensionAttributes': orderData.addressInformation.shippingExtraFields
            }
          }

          if (typeof shippingAddr !== 'undefined' && shippingAddr !== null) {
            shippingAddressInfo['addressInformation']['shippingAddress'] = {
              'countryId': shippingAddr.country_id,
              'street': shippingAddr.street,
              'telephone': shippingAddr.telephone,
              'postcode': shippingAddr.postcode,
              'city': shippingAddr.city,
              'firstname': shippingAddr.firstname,
              'lastname': shippingAddr.lastname,
              'email': shippingAddr.email,
              'regionId': mappedShippingRegion.regionId,
              'regionCode': mappedShippingRegion.regionCode,
              'region': shippingAddr.region,
              'company': shippingAddr.company,
              'save_in_address_book': shippingAddr.save_address
            }
          } else {
            shippingAddressInfo['addressInformation']['shippingAddress'] = shippingAddressInfo['addressInformation']['billingAddress']
          }

          logger.info(THREAD_ID + '< Billing info', billingAddressInfo)
          api.cart.billingAddress(null, cartId, billingAddressInfo, isThisAuthOrder).then((result) => {
            logger.info(THREAD_ID + '< Billing address assigned', result)
            logger.info(THREAD_ID + '< Shipping info', shippingAddressInfo)
            api.cart.shippingInformation(null, cartId, shippingAddressInfo, isThisAuthOrder).then((result) => {
              logger.info(THREAD_ID + '< Shipping address assigned', result)

              if (job) job.progress(currentStep++, TOTAL_STEPS);

              api.cart.order(null, cartId, {
                'paymentMethod': {
                  'method': orderData.addressInformation.payment_method_code,
                  'additional_data': orderData.addressInformation.payment_method_additional
                }
              }, isThisAuthOrder).then(result => {
                logger.info(THREAD_ID, result)
                if (job) job.progress(currentStep++, TOTAL_STEPS);

                logger.info(THREAD_ID + '[OK] Order placed with ORDER ID', result);
                logger.debug(THREAD_ID + result)
                if (orderData.order_id) {
                  redisClient.set('order$$id$$' + orderData.order_id, JSON.stringify({
                    platform_order_id: result,
                    transmited: true,
                    transmited_at: new Date(),
                    platform: 'magento2',
                    order: orderData
                  }));
                  redisClient.set('order$$totals$$' + orderData.order_id, JSON.stringify(result[1]));
                }
                let orderIncrementId = null;
                api.orders.incrementIdById(result).then(result => {
                  orderIncrementId = result.increment_id
                }).catch(err => {
                  logger.warn('could not fetch increment_id for Order', err, typeof err)
                }).finally(() => {
                  if (job) job.progress(currentStep++, TOTAL_STEPS);
                  return done(null, { magentoOrderId: result, orderNumber: orderIncrementId, backendOrderId: result, transferedAt: new Date() });
                })
              }).catch(err => {
                logger.error('Error placing an order', err, typeof err)
                if (job) job.attempts(6).backoff({delay: 30 * 1000, type: 'fixed'}).save()
                return done(composeError('Error placing an order.', err));
              })
            }).catch((errors) => {
              logger.error('Error while adding shipping address', errors)
              if (job) job.attempts(3).backoff({ delay: 60 * 1000, type: 'fixed' }).save()
              return done(composeError('Error while adding shipping address.', errors));
            })
          }).catch((errors) => {
            logger.error('Error while adding billing address', errors)
            if (job) job.attempts(3).backoff({ delay: 60 * 1000, type: 'fixed' }).save()
            return done(composeError('Error while adding billing address.', errors));
          })
        }).catch((errors) => {
          logger.error('Error while synchronizing country list', errors)
          if (job) job.attempts(3).backoff({ delay: 30 * 1000, type: 'fixed' }).save()
          return done(composeError('Error while syncing country list.', errors));
        })
      }).catch((errors) => {
        logger.error('Error while adding products', errors)
        if (job) job.attempts(3).backoff({ delay: 30 * 1000, type: 'fixed' }).save()
        return done(composeError('Error while adding products.', errors));
      })
    })
  }

  cartIdPrepare.then(processCart).catch((error) => { // cannot create a quote for specific user, so bypass by placing anonymous order
    logger.error(THREAD_ID, error)
    logger.info('< Bypassing to anonymous order')
    isThisAuthOrder = false

    if (isNumeric(cartId)) { // we have numeric id - assigned to the user provided
      api.cart.create(null, null).then((result) => {
        processCart(result)
        //      logger.info('< Assigning guest cart with the user')
        //      api.cart.assign(cartId, userId).then((subres) =>{
        //        console.info(subres)
        //        processCart(result)
        //      }).catch((err) => {
        //        logger.error(err)
        //      })
      }).catch(error => {
        logger.info(error)
        return done(composeError('Error while adding products.', error));
      }) // TODO: assign the guest cart with user at last?
    } else {
      logger.info(THREAD_ID + '< Using cartId provided with the order', cartId)
      processCart(cartId)
    }
  })
}

module.exports.processSingleOrder = processSingleOrder
