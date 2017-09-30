// Migration scripts use: https://github.com/tj/node-migrate
'use strict'

let config = require('../src/config.json')
let common = require('./.common')


module.exports.up = function (next) {


  // example of adding a filed to the schema
  // other examples: https://stackoverflow.com/questions/22325708/elasticsearch-create-index-with-mappings-using-javascript, 
  common.db.indices.putMapping({ 
    index: config.esIndexes[0],
    type: "product",
    body: {
        properties: {
            slug: { type: "string" }, // add slug field
            suggest: {
                type: "completion",
                analyzer: "simple",
                search_analyzer: "simple"
            }
        }
    }
  }).then((res) => {

   console.dir(res, {depth: null, colors: true})
   next()
  })
  
}

module.exports.down = function (next) {
  next()
}
