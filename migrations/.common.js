
let config = require('../src/config.json');
let kue = require('kue');
let queue = kue.createQueue(config.kue);

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
