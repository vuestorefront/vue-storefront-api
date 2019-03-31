
let config = require('config')
let kue = require('kue')
let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }))

let es = require('elasticsearch')
let port = config.elasticsearch.port
if (!port || port.length < 2) {
  port = ''
} else {
  port = `:${port}`
}
const esConfig = {
  host: `${config.elasticsearch.protocol}://${config.elasticsearch.host}${port}`,
  log: 'debug',
  apiVersion: config.elasticsearch.apiVersion,
  requestTimeout: 1000 * 60 * 60,
  keepAlive: false
}
if (config.elasticsearch.user && config.elasticsearch.user.length > 0) {
  esConfig.httpAuth = config.elasticsearch.user + ':' + config.elasticsearch.password
}
let client = new es.Client(esConfig)

exports.db = client
exports.queue = queue
