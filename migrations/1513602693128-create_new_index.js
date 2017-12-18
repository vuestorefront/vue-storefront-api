'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {
  let newIndexVersion = config.esIndexes[0] + '_temp'

  common.db.indices.create(
    {
      "index": newIndexVersion
    }).then(res => {
      console.dir(res, { depth: null, colors: true })
      next()
    }).catch(err => {
      console.dir(err, { depth: null, colors: true })
    })
}

module.exports.down = next => {
  next()
}
