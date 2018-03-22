'use strict'

const config = require('config')
const common = require('./.common')
import { putMappings } from '../src/lib/elastic'

module.exports.up = next => {
  putMappings(common.db, config.esIndexes[0], next);
}

module.exports.down = next => {
  next()
}
