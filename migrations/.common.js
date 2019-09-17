
const config = require('config')
const kue = require('kue')
const queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }))
const es = require('../src/lib/elastic')
const client = es.getClient(config)

exports.db = client
exports.queue = queue
