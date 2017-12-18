'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {
  let newIndexVersion = config.esIndexes[0] + '_temp'

  common.db.indices.putMapping({
        index: newIndexVersion,
        type: "product",
        body: {
          properties: {
            size: { type: "integer" },
            price: { type: "double" },
            color: { type: "integer" },
            pattern: { type: "string" },
            id: { type: "integer" },
            status: { type: "integer" },
            weight: { type: "integer" },
            visibility: { type: "integer" },
            created_at: { 
              type: "date",           
              format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
            },
            updated_at: { 
              type: "date",           
              format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
            },
            description: { type: "text" },
            name: { type: "text" },
          }
        }
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
