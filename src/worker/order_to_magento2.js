/**
 * CLI tool
 * Queue worker in charge of syncing the Sales order to Magento2 via REST API *
 */

const program = require('commander');
const kue = require('kue');
const logger = require('./log');

const config = require('config')
let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }));

let numCPUs = require('os').cpus().length;
const processSingleOrder = require('../platform/magento2/o2m').processSingleOrder

// RUN
program
  .command('start')
  .option('--partitions <partitions>', 'number of partitions', numCPUs)
  .action((cmd) => { // default command is to run the service worker
    let partition_count = parseInt(cmd.partitions);
    logger.info(`Starting KUE worker for "order" message [${partition_count}]...`);
    queue.process('order', partition_count, (job, done) => {
      logger.info('Processing order: ' + job.data.title);
      return processSingleOrder(job.data.order, config, job, done);
    });
  });

program
  .command('testAuth')
  .action(() => {
    processSingleOrder(require('../../var/testOrderAuth.json'), config, null, (err, result) => {});
  });

program
  .command('testAnon')
  .action(() => {
    processSingleOrder(require('../../var/testOrderAnon.json'), config, null, (err, result) => {});
  });

program
  .on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program
  .parse(process.argv)
