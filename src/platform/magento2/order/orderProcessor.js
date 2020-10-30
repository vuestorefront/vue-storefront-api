import {productsEquals} from 'vsf-utilities';
import order from '../../../api/order';
const orderUtilities = require('./order-utilities');
const apiUtilities = require('./api-utilities');
const config = require('config');
const redis = require('../../../lib/redis');
const redisClient = redis.getClient(config)
const logger = console;
const countryMapper = require('../../../lib/countrymapper')

const TOTAL_STEPS = 4;
var currentStep = 1;

/**
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @returns {Promise}
 */
async function cartIdPrepare (orderData) {
  const api = apiUtilities.getApi(orderData.store_code);
  const isThisAuthOrder = orderUtilities.isThisAuthOrder(orderData);
  const {
    cart_id: cartId,
    user_id: userId
  } = orderData;

  return isThisAuthOrder ? api.cart.create(null, userId) : (cartId ? new Promise((resolve, reject) => {
    resolve(cartId)
  }) : api.cart.create(null));
}

/**
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param job
 * @param {Function} done callback - @example done(new Error()) - to acknowledge problems
 * @returns {Promise<*>}
 */
async function processCart ({ orderData, job, done }) {
  try {
    await updateCartItems({ job, orderData });
  } catch (err) {
    if (job) job.attempts(3).backoff({ delay: 30 * 1000, type: 'fixed' }).save();
    return done(orderUtilities.composeError('Error while adding products.', err));
  }

  const shippingInformation = await assignAddresses({ job, orderData, done });
  var orderId;

  try {
    orderId = await placeOrder({ shippingInformation, orderData, job });
  } catch (err) {
    if (job) job.attempts(3).backoff({ delay: 30 * 1000, type: 'fixed' }).save();
    return done(orderUtilities.composeError('Error placing an order.', err));
  }

  fetchIncrementId({ job, orderData, orderId });
}

/**
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param job
 * @param {int} orderId Created Order ID
 * @returns {Promise}
 */
async function fetchIncrementId ({ orderData, job, orderId }) {
  const THREAD_ID = orderUtilities.getThreadId(job);
  const api = apiUtilities.getApi(orderData.store_code);
  try {
    const order = await api.orders.incrementIdById(orderId);
    const orderIncrementId = order.increment_id;
    logger.debug(`${THREAD_ID} [OK] Order increment id`, orderIncrementId);
    updateStep(job);
  } catch (err) {
    logger.warn('could not fetch increment_id for Order', err, typeof err);
  }
}

/**
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param job
 * @returns {Promise<*>}
 */
async function updateCartItems ({ orderData, job }) {
  const {
    cart_id: cartId,
    products: clientItems
  } = orderData;

  const THREAD_ID = orderUtilities.getThreadId(job);
  logger.info(THREAD_ID + '< Cart Id', cartId);
  const api = apiUtilities.getApi(order.store_code);

  const isThisAuthOrder = orderUtilities.isThisAuthOrder(orderData);
  const serverItems = await api.cart.pull(null, cartId, null, isThisAuthOrder);
  var syncPromises = [];

  for (const clientItem of clientItems) {
    const serverItem = serverItems.find(itm => productsEquals(itm, clientItem));
    if (!serverItem) {
      logger.info(THREAD_ID + '< No server item for ' + clientItem.sku)
      syncPromises.push(api.cart.update(null, cartId, { // use magento API
        sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
        qty: clientItem.qty,
        product_option: clientItem.product_option,
        quote_id: cartId
      }, isThisAuthOrder));
    } else if (serverItem.qty !== clientItem.qty) {
      logger.info(THREAD_ID + '< Wrong qty for ' + clientItem.sku, clientItem.qty, serverItem.qty)
      syncPromises.push(api.cart.update(null, cartId, { // use magento API
        sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
        qty: clientItem.qty,
        product_option: clientItem.product_option,
        item_id: serverItem.item_id,
        quote_id: cartId
      }, isThisAuthOrder));
    } else {
      // here we need just update local item_id
      logger.info(THREAD_ID + '< Server and client items synced for ' + clientItem.sku);
    }
  }

  for (const serverItem of serverItems) {
    if (serverItem) {
      const clientItem = clientItems.find(itm => productsEquals(itm, serverItem));

      if (!clientItem) {
        logger.info(THREAD_ID + '< No client item for ' + serverItem.sku + ', removing from server cart') // use magento API
        syncPromises.push(api.cart.delete(null, cartId, { // delete server side item if not present if client's cart
          sku: serverItem.sku,
          item_id: serverItem.item_id
        }, isThisAuthOrder))
      }
    }
  }

  const results = await Promise.all(syncPromises);
  updateStep(job);
  logger.info(THREAD_ID + '< Server cart in sync')
  logger.debug(THREAD_ID + results);
}

async function placeOrder ({ orderData, shippingInformation, job }) {
  const {
    cart_id: cartId
  } = orderData;

  var {
    payment_methods: [
      {
        code: paymentMethod
      }
    ]
  } = shippingInformation;
  const THREAD_ID = orderUtilities.getThreadId(job);

  logger.info(`${THREAD_ID} Place order`);
  const api = apiUtilities.getApi(order.store_code);
  const orderId = await api.cart.order(null, cartId, {
    'paymentMethod': {
      'method': paymentMethod,
      'additional_data': orderData.addressInformation.payment_method_additional
    }}, orderUtilities.isThisAuthOrder(orderData));

  updateStep(job);
  logger.info(`${THREAD_ID} [OK] Order placed with ORDER ID`, orderId);
  logger.debug(`${THREAD_ID} [OK] Order placed with ORDER ID`, orderId);

  if (orderData.order_id) {
    redisClient.set('order$$id$$' + orderData.order_id, JSON.stringify({
      platform_order_id: orderId,
      transmited: true,
      transmited_at: new Date(),
      platform: 'magento2',
      order: orderData
    }));
  }

  return orderId;
}

/**
 * Prepare and send billing and shipping address to Magento
 * @param orderData
 * @param job
 * @param done
 * @returns {Promise<*>}
 */
async function assignAddresses ({ orderData, job, done }) {
  const {
    cart_id: cartId,
    addressInformation: {
      billingAddress: billingAddr,
      shippingAddress: shippingAddr
    }
  } = orderData;
  const api = apiUtilities.getApi(orderData.store_code);

  try {
    var countryList = await api.directory.countries();
  } catch (error) {
    if (job) job.attempts(3).backoff({ delay: 30 * 1000, type: 'fixed' }).save()
    return done(orderUtilities.composeError('Error while syncing country list.', error));
  }

  var mappedBillingRegion = countryMapper.mapCountryRegion(
    countryList,
    billingAddr.country_id,
    billingAddr.region_code ? billingAddr.region_code : billingAddr.region
  );

  var mappedShippingRegion;

  if (typeof shippingAddr !== 'undefined' && shippingAddr !== null) {
    mappedShippingRegion = countryMapper.mapCountryRegion(
      countryList,
      shippingAddr.country_id,
      shippingAddr.region_code ? shippingAddr.region_code : shippingAddr.region
    );
  }

  const billingAddressInfo = orderUtilities.getBillingAddress(billingAddr, mappedBillingRegion);
  const shippingAddressInfo = orderUtilities.getShippingAddressInformation(
    billingAddr,
    mappedBillingRegion,
    orderData,
    mappedShippingRegion
  );

  const THREAD_ID = orderUtilities.getThreadId(job);
  logger.info(THREAD_ID + '< Billing info', billingAddressInfo);

  try {
    const billingAddress = await api.cart.billingAddress(
      null,
      cartId,
      billingAddressInfo,
      orderUtilities.isThisAuthOrder(orderData)
    );
    logger.info(THREAD_ID + '< Billing address assigned', billingAddress);
  } catch (err) {
    logger.error('Error while adding billing address', err)
    if (job) job.attempts(3).backoff({ delay: 60 * 1000, type: 'fixed' }).save()
    return done(orderUtilities.composeError('Error while adding billing address.', err));
  }

  logger.info(THREAD_ID + '< Shipping info', shippingAddressInfo);

  try {
    const shippingInformation = await api.cart.shippingInformation(
      null,
      cartId,
      shippingAddressInfo,
      orderUtilities.isThisAuthOrder(orderData)
    );
    logger.info(THREAD_ID + '< Shipping address assigned', shippingInformation);
    updateStep(job);
    return shippingInformation;
  } catch (err) {
    logger.error('Error while adding shipping address', err)
    if (job) job.attempts(3).backoff({ delay: 60 * 1000, type: 'fixed' }).save()
    return done(orderUtilities.composeError('Error while adding shipping address.', err));
  }
}

/**
 * Verify if json order data is valid
 * @param orderData
 * @param job
 * @param done
 * @returns {boolean}
 */
function validateOrder ({ orderData, job, done }) {
  const THREAD_ID = orderUtilities.getThreadId(job);

  if (!orderUtilities.validateOrder(orderData)) {
    const orderErrors = orderUtilities.getOrderErrors(orderData);
    logger.error(THREAD_ID + ' Order validation error!', orderErrors);
    updateStep(job);
    done(orderUtilities.composeError('Error while validating order object.', orderErrors));

    return false;
  }

  return true;
}

/**
 * Increment current step
 * @param job
 */
function updateStep (job) {
  if (job) {
    job.progress(currentStep++, TOTAL_STEPS)
  } else {
    logger.info(`Current Step: ${currentStep++}. Total number of steps ${TOTAL_STEPS}`);
  }
}

module.exports = {
  validateOrder,
  cartIdPrepare,
  processCart
};
