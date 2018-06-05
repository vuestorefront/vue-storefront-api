'use strict'

const config = require('config')
const common = require('./.common')
const createIndex = require('../src/lib/elastic').createIndex

module.exports.up = next => {
  createIndex(common.db, config.elasticsearch.indices[0], next)
}

module.exports.down = next => {
  next()
}
