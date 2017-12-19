'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {

  common.db.indices.create(
    {
      "index": config.esIndexes[0]
    }).then(res => {
      console.dir(res, { depth: null, colors: true })
      next()
    }).catch(err => {
      console.error(err)
    })
}

module.exports.down = next => {
  next()
}
