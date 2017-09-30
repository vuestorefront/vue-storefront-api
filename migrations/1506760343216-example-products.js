// Migration scripts use: https://github.com/tj/node-migrate
'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = function (next) {

  // common.db = elasticsearch-js elastic client: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
  // add product programmaticaly
  common.db.create({
    index: config.esIndexes[0],
    type: 'product',
    id: '99999',
    body: {"id":22,"sku":"24-WG088","name":"Sprite Foam Roller","attribute_set_id":11,"price":19,"status":1,"visibility":4,"type_id":"simple","created_at":"2017-09-16 13:46:47","updated_at":"2017-09-16 13:46:47","extension_attributes":[],"product_links":[],"tier_prices":[],"custom_attributes":null,"category":[{"category_id":2,"name":"Default Category"},{"category_id":3,"name":"Gear"},{"category_id":5,"name":"Fitness Equipment"}],"tsk":1505573582376,"description":"<p>It hurts so good to use the Sprite Foam Roller on achy, tired muscles for myofascial massage therapy. Or you can add this fundamental piece to your Pilates and yoga accouterment, or apply towards core stability, strengthening and balance exercise. </p>\n<ul>\n<li>6'' wide by 12'' long.</li>\n<li>Safe for myofascial release.</li>\n<li>EPP or PE foam options.</li>\n<li>Solid, dense, closed-cell foam.</li>\n</ul>","image":"/l/u/luma-foam-roller.jpg","small_image":"/l/u/luma-foam-roller.jpg","thumbnail":"/l/u/luma-foam-roller.jpg","options_container":"container2","required_options":"0","has_options":"0","url_key":"sprite-foam-roller","tax_class_id":"2","activity":"8,11","material":"42","gender":"80,81,84","category_gear":"87"}
  }).then( (response) => {
    
    
    common.db.delete({ // now remove this example product
      index: config.esIndexes[0],
      type: 'product',
      id: '99999'
    }, function (error, response) {

      next() // go to next migration

    });
    
    
  })

  
}

module.exports.down = function (next) {
  next()
}
