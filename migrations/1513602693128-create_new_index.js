'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {

  common.db.indices.delete({
    "index": config.esIndexes[0]
  }).then(res1 => {
    console.dir(res1, { depth: null, colors: true })
    common.db.indices.create(
      {
        "index": config.esIndexes[0]
      }).then(res2 => {
        console.dir(res2, { depth: null, colors: true })
        next()
      }).catch(err => {
        console.error(err)
        next(err)
      })
  }).catch(() => {
    common.db.indices.create(
      {
        "index": config.esIndexes[0]
      }).then(res2 => {
        console.dir(res2, { depth: null, colors: true })
        next()
      }).catch(err => {
        console.error(err)
        next(err)
      })
  })
}

module.exports.down = next => {
  next()
}
