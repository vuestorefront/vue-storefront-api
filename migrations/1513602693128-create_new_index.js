'use strict'

import config from 'config'
import common from './.common'
import { createIndex } from '../src/lib/elastic';

module.exports.up = next => {
  createIndex(common.db, config.esIndexes[0], next)
}

module.exports.down = next => {
  next()
}
