'use strict'

import { reIndex } from '../src/lib/elastic'
import config from 'config'
import common from './.common'

module.exports.up = next => {
  let finalIndexVersion = config.esIndexes[0]
  let tempIndexVersion = config.esIndexes[0] + '_temp'

  reIndex(common.db, tempIndexVersion, finalIndexVersion, next)
}

module.exports.down = next => {
  next()
}
