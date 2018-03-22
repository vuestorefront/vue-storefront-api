'use strict'

import { reIndex } from '../src/lib/elastic';
let config = require('config')
let common = require('./.common')

module.exports.up = next => {
  let finalIndexVersion = config.esIndexes[0]
  let tempIndexVersion = config.esIndexes[0] + '_temp'

  reIndex(common.db, tempIndexVersion, finalIndexVersion, next)
}

module.exports.down = next => {
  next()
}
