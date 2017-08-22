/**
 * CLI tool
 * Queue worker in charge of syncing the Sales order to Magento2 via REST API * 
 */

const kue = require('kue');
const queue = kue.createQueue();
const logger = require('./log');
const unirest = require('unirest');


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

    return unirest[method](config.magento2.url + 'V1/' + endpoint).headers(headers)
  }

/**
 * Send single order to Magento Instance
 * 
 * The Magento2 API: https://magento.stackexchange.com/questions/136028/magento-2-create-order-using-rest-api
 * 
 * @param {json} orderData order data with format as described in '../models/order.md'
 * @param {Object} config global CLI configuration
 */
function processSingleOrder(orderData, config){

    const apiClient = client('post', 'guest-carts').send().end( (response)=> {
        console.log(response);

    });

    

}


// RUN
 
cli.command('start', ()=>{  // default command is to run the service worker

    let partition_count = cli.options.partitions;
    
    logger.info('Starting KUE worker for "order" message ...');
    queue.process('order', partition_count, (job,done) => {

        const order = job.data.order;
        logger.info('Processing order: ' + job.data.title);
        processSingleOrder(order, config);
        
        return done(); // end of processing
    });


});


cli.command('test', ()=> {
    processSingleOrder(require('../../var/testOrder.json'), config);
});


cli.parse(process.argv);
