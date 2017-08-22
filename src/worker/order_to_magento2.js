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


import config from '../config.json';
let numCPUs = require('os').cpus().length;

const CommandRouter = require('command-router');
const cli = CommandRouter();
cli.option({
    name: 'partitions',
      default: numCPUs,
      type: Number
  });

  /**
   * Return Magento API client
   * @param {string} method - post, put, get ...
   * @param {string} endpoint relative to /rest/V1/<endpoint>
   * @param {Object} addHeaders dictionary of http headers
   */
  function client(method, endpoint, addHeaders){
    let headers = Object.assign({
        'Accept': 'application/json', 
        'Content-Type': 'application/json'        
      }, addHeaders);


    const baseUrl = process.env.MAGE_URL || config.magento2.url;
    const httpUser = process.env.MAGE_HTTP_USER || config.magento2.httpUserName;
    const httpPass = process.env.MAGE_HTTP_PASS || config.magento2.httpPassword;
    
    const url = baseUrl + 'V1/' + endpoint;
    return unirest[method](url).auth({
        user: httpUser,
        pass: httpPass,
        sendImmediately: false // send only if asked
      }).headers(headers)
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
function processSingleOrder(orderData, config, job, done){

    const TOTAL_STEPS = 4;
    const THREAD_ID = 'ORD:' + job.id; // job id 
    let currentStep = 1;

    if (!validate(orderData)) { // schema validation of upcoming order
        logger.error(THREAD_ID +" Order validation error!", validate.errors);
        done(new Error('Error while validating order object',  validate.errors));

        if(job) job.progress(currentStep++, TOTAL_STEPS);
        return;
    }			
   
    new Promise((resolve, reject) =>  // TODO: add magento client authorization support to support logged in customers
        client('post', 'guest-carts').send().end( (response)=> {
            resolve(response.body.replace("\"", ""));
            if(job) job.progress(currentStep++, TOTAL_STEPS);
        })
    ).then((cartKey) => {

        logger.info(THREAD_ID + ' CART KEY = ' + cartKey);
        logger.debug(THREAD_ID + '+ Adding products...');

        const productPromises = new Array();
        for(const orderItem of orderData.products){
            
            productPromises.push(
                new Promise((resolve, reject) => {

                    client('post', 'guest-carts/' + cartKey + '/items').send( { // add products to cart
                        cartItem: {
                            sku: orderItem.sku, 
                            qty: orderItem.qty, 
                            quoteId: cartKey}
                    }).end((response) => {
                        if(response.code >=200 && response.code <= 299) // OK
                        {
                            logger.debug(THREAD_ID +' Product ' + orderItem.sku +' added.');
                            resolve( response.body);
                        }
                        else{ 
                            reject(response.body);
                        }
                    })
                })
            );
        }

        Promise.all(productPromises).then((results) =>{
            
            if(job) job.progress(currentStep++, TOTAL_STEPS);

            // up to this point - all products added to the cart

            const billingAddr = orderData.addressInformation.billingAddress;
            const shippingAddr = orderData.addressInformation.shippingAddress;
            
            const addPromises = new Array();
            addPromises.push(
                new Promise((resolve, reject) => {
        

                    client('post', 'guest-carts/' + cartKey + '/billing-address').send( { // sum up totals

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
                                "company": billingAddr.company
                            }
                    
                    }).end((response) => {
                        resolve( response.body);
                        job.progress(1, 5);
                    })
                })
            );
            
            
            addPromises.push(
                new Promise((resolve, reject) => {
                    
            
                            client('post', 'guest-carts/' + cartKey + '/shipping-information').send( { // sum up totals
            
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
                                            "company": billingAddr.company
                                        },
                                        "shippingMethodCode": orderData.addressInformation.shipping_method_code,
                                        "shippingCarrierCode": orderData.addressInformation.shipping_carrier_code
                                    }
                                
                            }).end((response) => {
                                resolve( response.body);
                            })
                        })
                    );
                    
                    Promise.all(addPromises).then( (result) => {
                                // addressses already added
                            logger.debug(THREAD_ID +"  + Addresses already added, placing order!")
                            if(job) job.progress(currentStep++, TOTAL_STEPS);

                            client('put', 'guest-carts/' + cartKey + '/order').send( { // sum up totals
                                
                                                    "paymentMethod":
                                                        {
                                                        "method":orderData.addressInformation.payment_method_code
                                                        }
                                                    
                                                }).end((response) => {
                                                    logger.info(THREAD_ID +" Order placed with ORDER ID", response.body);
                                                    if(job) job.progress(currentStep++, TOTAL_STEPS);
                                                    return done(null, { magentoOrderId: response.body, transferedAt: new Date() });
                                                })

                    }).catch((errors) => {
                        logger.error(THREAD_ID + ' Error while adding addresses!', errors);
                        return done(new Error('Error while adding addresses', errors));
                    });


        }).catch((results) => {
        
            logger.error(THREAD_ID + ' Error while adding products ', results);
            return done(new Error('Error while adding products', results));
        });
        
 
    });

    

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


cli.command('test', ()=> {
    processSingleOrder(require('../../var/testOrder.json'), config, null, (err, result) => {});
});


cli.parse(process.argv);
