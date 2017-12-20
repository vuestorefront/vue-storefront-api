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
            size_options: { type: "integer" },
            price: { type: "float" },
            special_price: { type: "float" },
            color: { type: "integer" },
            color_options: { type: "integer" },
            pattern: { type: "string" },
            id: { type: "long" },
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
            special_from_date: {
              type: "date",           
              format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
            },
            special_to_date: {
              type: "date",           
              format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
            },
            news_from_date: {
              type: "date",           
              format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
            },
            description: { type: "text" },
            name: { type: "text" },
            configurable_children: {
              properties: {
                price: { type: "float" }
              }
            },
            configurable_options: {
              properties: {
                attribute_id: { type: "long" }
              }
            },
            category_ids: { type: "long" },
            eco_collection: { type: "integer" },
            eco_collection_options: { type: "integer" },
            erin_recommends: { type: "integer" },
            tax_class_id: { type: "long" }
          }
        }
      }).then(res1 => {
        console.dir(res1, { depth: null, colors: true })

        common.db.indices.putMapping({
          index: config.esIndexes[0],
          type: "taxrule",
          body: {
            properties: {
              id: { type: "long" },
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
        next(err1)
      })
}

module.exports.down = next => {
  next()
}
