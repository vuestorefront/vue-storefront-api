// Migration scripts use: https://github.com/tj/node-migrate
'use strict'

let config = require('../src/config.json')
let common = require('./.common')


module.exports.up = function (next) {


  // example of adding a filed to the schema
  // other examples: https://stackoverflow.com/questions/22325708/elasticsearch-create-index-with-mappings-using-javascript, 

  let oldIndexVersion = config.esIndexes[0];
  let newIndexVersion = config.esIndexes[0] + new Date().getTime().toString();

  common.db.indices.create(
    {
      "index": newIndexVersion
    }).then((res) => {

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
      }).then((res) => {

        console.dir(res, { depth: null, colors: true })

        common.db.reindex({
          body: {
            "source": {
              "index": oldIndexVersion
            },
            "dest": {
              "index": newIndexVersion
            }
          }

        }).then((res) => {


          common.db.indices.delete(
            {
              "index": config.esIndexes[0]
            }).then((res) => {
              console.dir(res, { depth: null, colors: true })
              common.db.indices.putAlias({
                index: newIndexVersion, 
                name: oldIndexVersion
              })
              next()

            })

        })

      })
    })

}

module.exports.down = function (next) {
  next()
}
