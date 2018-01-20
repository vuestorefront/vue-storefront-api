'use strict'

let config = require('config')
let common = require('./.common')

module.exports.up = next => {
  let finalIndexVersion = config.esIndexes[0]
  let tempIndexVersion = config.esIndexes[0] + '_temp'

  common.db.reindex({
    body: {
      "source": {
        "index": tempIndexVersion
      },
      "dest": {
        "index": finalIndexVersion
      }
    }
  }).then(res => {
    console.dir(res, { depth: null, colors: true })
    next()
  }).catch(err => {
    console.error(err)
    next(err)
  })
}

module.exports.down = next => {
  next()
}
