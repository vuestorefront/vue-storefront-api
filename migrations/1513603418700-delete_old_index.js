'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {
  let tempIndexVersion = config.esIndexes[0] + '_temp'

  common.db.indices.delete({
    "index": tempIndexVersion
  }).then((res) => {
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
