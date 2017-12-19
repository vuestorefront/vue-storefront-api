'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {

  common.db.indices.putMapping({
        index: config.esIndexes[0],
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
      }).then(res1 => {
        console.dir(res1, { depth: null, colors: true })

        common.db.indices.putMapping({
          index: config.esIndexes[0],
          type: "taxrule",
          body: {
            properties: {
              rates: {
                properties: {
                  rate: { type: "float" }
                }
              }
            }
          }
        }).then(res2 => {
          console.dir(res2, { depth: null, colors: true })
          next()
        }).catch(err2 => {
          throw new Error(err2)
        })
      }).catch(err1 => {
        console.error(err1)
      })
}

module.exports.down = next => {
  next()
}
