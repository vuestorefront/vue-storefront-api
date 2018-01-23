/**
 * CLI tool
 * Queue worker in charge of syncing the Sales order to Magento2 via REST API * 
 */

const kue = require('kue');
const queue = kue.createQueue();
const logger = require('./log');
const unirest = require('unirest');

const Ajv = require('ajv'); // json validator
const ajv = new Ajv(); // validator
const validate = ajv.compile(require('../models/order.schema.json'));

const config = require('config')

let numCPUs = require('os').cpus().length;


const Magento2Client = require('../platform/magento2/magento2-rest-client').Magento2Client;
const api = Magento2Client(config.magento2.api);

const CommandRouter = require('command-router');
const cli = CommandRouter();
cli.option({
    name: 'partitions',
      default: numCPUs,
      type: Number
  });

/** 
 * Send single order to Magento Instance
 * 
 * The Magento2 API: https://magento.stackexchange.com/questions/136028/magento-2-create-order-using-rest-api
 * 
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param {Object} config global CLI configuration
 * @param {Function} done callback - @example done(new Error()) - to acknowledge problems
 */
function processSingleOrder(orderData, config, job, done){

    const TOTAL_STEPS = 4;
    const THREAD_ID = 'ORD:' + (job ? job.id : 1); // job id 
    let currentStep = 1;

    if (!validate(orderData)) { // schema validation of upcoming order
        logger.error(THREAD_ID +" Order validation error!", validate.errors);
        done(new Error('Error while validating order object',  validate.errors));

        if(job) job.progress(currentStep++, TOTAL_STEPS);
        return;
    }

    let isThisAuthOrder = parseInt(orderData.user_id) > 0
    const userId = orderData.user_id

    logger.info('> Is order authorized?', isThisAuthOrder)
    logger.log('> User Id', userId)

    let cartId = orderData.cart_id
    const cartIdPrepare = isThisAuthOrder ? api.cart.create(null, userId) : new Promise((resolve, reject) => {
        resolve (cartId)
    })
    logger.log('> Cart Id', cartId)

    const processCart = (result) => {
        cartId = result


        logger.log('< Cart Id', cartId)

        // load current cart from the Magento to synchronize elements
        api.cart.pull(null, cartId, null, isThisAuthOrder).then((serverItems) => {

            const clientItems = orderData.products
            const syncPromises = []
            
            logger.log('> Sync between clientItems', clientItems.map((item) => { return { sku: item.sku, qty: item.qty, server_item_id: item.server_item_id }}))
            logger.log('> ... and serverItems', serverItems)

            for (const clientItem of clientItems) {
                const serverItem = serverItems.find((itm) => {
                    return itm.sku === clientItem.sku
                })
            
                if (!serverItem) {
                    logger.log('< No server item for ' + clientItem.sku)
                    syncPromises.push(api.cart.update(null, cartId, { // use magento API
                        sku: clientItem.sku,
                        qty: clientItem.qty,
                        quote_id: cartId
                    }, isThisAuthOrder))
                } else if (serverItem.qty !== clientItem.qty) {
                    logger.log('< Wrong qty for ' + clientItem.sku, clientItem.qty, serverItem.qty)
                    syncPromises.push(api.cart.update(null, cartId, { // use magento API
                        sku: clientItem.sku,
                        qty: clientItem.qty,
                        item_id: serverItem.item_id,
                        quote_id: cartId
                    }, isThisAuthOrder))
                } else {
                    logger.log('< Server and client items synced for ' + clientItem.sku) // here we need just update local item_id
                }
            }
        
            for (const serverItem of serverItems) {
            if (serverItem) {
                const clientItem = clientItems.find((itm) => {
                return itm.sku === serverItem.sku
                })
                if (!clientItem) {
                logger.log('< No client item for ' + serverItem.sku + ', removing from server cart') // use magento API
                syncPromises.push(api.cart.delete(null, cartId, { // delete server side item if not present if client's cart
                    sku: serverItem.sku,
                    item_id: serverItem.item_id
                }, isThisAuthOrder))
                }
            }
            }
            

            Promise.all(syncPromises).then((results) => {
                if(job) job.progress(currentStep++, TOTAL_STEPS);
                logger.log('< Server cart in sync')
                logger.debug(THREAD_ID + results)

                const billingAddr = orderData.addressInformation.billingAddress;
                const shippingAddr = orderData.addressInformation.shippingAddress;

                const addressPromises = []

                addressPromises.push(api.cart.billingAddress(null, cartId,  { // sum up totals

                    "address":
                        {
                            "countryId": billingAddr.country_id,
                            "street": billingAddr.street, 
                            "telephone": billingAddr.telephone, 
                            "postcode": billingAddr.postcode, 
                            "city": billingAddr.city,
                            "firstname": billingAddr.firstname,
                            "lastname": billingAddr.lastname,
                            "email": billingAddr.email,
                            "regionCode": billingAddr.regionCode,
                            "company": billingAddr.company,
                            "vatId": billingAddr.vat_id
                        }
                
                }, isThisAuthOrder))

                addressPromises.push(api.cart.shippingInformation(null, cartId,  { // sum up totals

                    "addressInformation":
                    {
                    "shippingAddress":
                        {
                            "countryId": shippingAddr.country_id,
                            "street": shippingAddr.street, 
                            "telephone": shippingAddr.telephone, 
                            "postcode": shippingAddr.postcode, 
                            "city": shippingAddr.city,
                            "firstname": shippingAddr.firstname,
                            "lastname": shippingAddr.lastname,
                            "email": shippingAddr.email,
                            "regionCode": shippingAddr.regionCode,
                            "company": shippingAddr.company
                        },

                        "billingAddress":
                        {
                            "countryId": billingAddr.country_id,
                            "street": billingAddr.street, 
                            "telephone": billingAddr.telephone, 
                            "postcode": billingAddr.postcode, 
                            "city": billingAddr.city,
                            "firstname": billingAddr.firstname,
                            "lastname": billingAddr.lastname,
                            "email": billingAddr.email,
                            "regionCode": billingAddr.regionCode,
                            "company": billingAddr.company,
                            "vatId": billingAddr.vat_id
                        },
                        "shippingMethodCode": orderData.addressInformation.shipping_method_code,
                        "shippingCarrierCode": orderData.addressInformation.shipping_carrier_code
                    }
                
                }, isThisAuthOrder))            


                Promise.all(addressPromises).then((results) => {
                    logger.log('< Addresses assigned', results)
                    logger.debug(THREAD_ID + results)
                    
                    if(job) job.progress(currentStep++, TOTAL_STEPS);

                    api.cart.order(null, cartId, {
                        "paymentMethod":
                        {
                            "method":orderData.addressInformation.payment_method_code
                        }                 
                    }, isThisAuthOrder).then(result => {
                        logger.log(results)
                        if(job) job.progress(currentStep++, TOTAL_STEPS);

                        logger.info(THREAD_ID + '[OK] Order placed with ORDER ID', result);
                        logger.debug(THREAD_ID + result)
                        if(job) job.progress(currentStep++, TOTAL_STEPS);
                        return done(null, { magentoOrderId: result[0], magentoOrderTotals: result[1], transferedAt: new Date() });                    
                    }).catch(err => {
                        logger.error(err)
                    })
                }).catch((errors) => {
                    logger.error(errors)
                    return done(new Error('Error while adding products', errors));
                })
                

            }).catch((errors) => {
                logger.error(errors)
                return done(new Error('Error while adding products', errors));
            })
            
        })
    }

    cartIdPrepare.then(processCart).catch((error) => { // cannot create a quote for specific user, so bypass by placing anonymous order
        logger.error(error)
        logger.info('< Bypassing to anonymous order')
        isThisAuthOrder = false
        
        if (parseInt(cartId) > 0) { // we have numeric id - assigned to the user provided
            api.cart.create(null, null).then((result) => {
                processCart(result)
    //            logger.info('< Assigning guest cart with the user')
    //            api.cart.assign(cartId, userId).then((subres) =>{
    //                console.log(subres)
    //                processCart(result)
    //           }).catch((err) => {
    //               logger.error(err)
    //           })
            }).catch(error => { 
                console.log(error)
                return done(new Error('Error while adding products', error));
            }) // TODO: assign the guest cart with user at last?
        } else {
            logger.info('< Using cartId provided with the order', cartId)
            processCart(cartId)
        }
    })

}


// RUN
 
cli.command('start', ()=>{  // default command is to run the service worker

    let partition_count = cli.options.partitions;
    
    logger.info('Starting KUE worker for "order" message ...');
    queue.process('order', partition_count, (job,done) => {

        logger.info('Processing order: ' + job.data.title);
        return processSingleOrder(job.data.order, config, job, done);
        
        
    });


});


cli.command('testAuth', ()=> {
    processSingleOrder(require('../../var/testOrderAuth.json'), config, null, (err, result) => {});
});

cli.command('testAnon', ()=> {
    processSingleOrder(require('../../var/testOrderAnon.json'), config, null, (err, result) => {});
});


cli.parse(process.argv);
