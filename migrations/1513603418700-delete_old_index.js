'use strict'

import { deleteIndex } from '../src/lib/elastic';
import config from 'config'
import common from './.common'

module.exports.up = next => {
  let tempIndexVersion = config.esIndexes[0] + '_temp'
  deleteIndex(common.db, tempIndexVersion, next)
}

module.exports.down = next => {
  next()
}
