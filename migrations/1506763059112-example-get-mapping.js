// Migration scripts use: https://github.com/tj/node-migrate
'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = function (next) {


  common.db.indices.getMapping({   
    index: config.esIndexes[0],
    type: "product",
  }).then((mapping) => {
    
    console.dir(mapping, {depth: null, colors: true})
    
    next()
  })
}

module.exports.down = function (next) {
  next()
}
