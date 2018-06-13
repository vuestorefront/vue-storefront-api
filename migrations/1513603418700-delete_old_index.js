'use strict'

const deleteIndex = require('../src/lib/elastic').deleteIndex
const config = require('config')
const common = require('./.common')

module.exports.up = next => {
  let tempIndexVersion = config.elasticsearch.indices[0] + '_temp'
  deleteIndex(common.db, tempIndexVersion, next)
}

module.exports.down = next => {
  next()
}
