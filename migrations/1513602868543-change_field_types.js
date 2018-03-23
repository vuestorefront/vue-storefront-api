'use strict'

const config = require('config')
const common = require('./.common')
const putMappings = require('../src/lib/elastic').putMappings

module.exports.up = next => {
  putMappings(common.db, config.esIndexes[0], next);
}

module.exports.down = next => {
  next()
}
