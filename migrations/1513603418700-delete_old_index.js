import { deleteIndex } from '../src/lib/elastic';

'use strict'

let config = require('config')
let common = require('./.common')

module.exports.up = next => {
  let tempIndexVersion = config.esIndexes[0] + '_temp'
  deleteIndex(common.db, tempIndexVersion, next)
}

module.exports.down = next => {
  next()
}
