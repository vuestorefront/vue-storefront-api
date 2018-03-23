'use strict'

const config = require('config')
const common = require('./.common')
const reIndex = require('../src/lib/elastic').reIndex

module.exports.up = next => {
  let finalIndexVersion = config.esIndexes[0]
  let tempIndexVersion = config.esIndexes[0] + '_temp'

  reIndex(common.db, tempIndexVersion, finalIndexVersion, next)
}

module.exports.down = next => {
  next()
}
