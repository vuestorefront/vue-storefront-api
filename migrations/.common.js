
let config = require('config');
let kue = require('kue');
let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }));

let es = require('elasticsearch')
let client = new es.Client({
  host: config.esHost,
  log: 'debug',
  apiVersion: '5.5',
  requestTimeout: 1000 * 60 * 60,
  keepAlive: false
})

exports.db = client        
exports.queue = queue
