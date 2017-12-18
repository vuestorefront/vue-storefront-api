'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = next => {

  common.db.create({
    index: config.esIndexes[0],
    type: 'taxrule',
    id: '1',
    body: {
      "id": 1,
      "code": "Rule1",
      "priority": 0,
      "position": 0,
      "customer_tax_class_ids": [3],
      "product_tax_class_ids": [2],
      "tax_rate_ids": [3],
      "calculate_subtotal": false,
      "rates": [
        {
          "id": 3,
          "tax_country_id": "US",
          "tax_region_id": 33,
          "region_name": "MI",
          "tax_postcode": "*",
          "rate": 8.25,
          "code": "US-MI-*-Rate 1",
          "titles": []
        }
      ],
      "tsk": 1510603185144
    }
  }).then(res1 => {
    console.dir(res1, { depth: null, colors: true })

    common.db.create({
      index: config.esIndexes[0],
      type: 'taxrule',
      id: '2',
      body: {
        "id": 2,
        "code": "Poland",
        "priority": 0,
        "position": 0,
        "customer_tax_class_ids": [3],
        "product_tax_class_ids": [2],
        "tax_rate_ids": [4],
        "calculate_subtotal": false,
        "rates": [
          {
            "id": 4,
            "tax_country_id": "PL",
            "tax_region_id": 0,
            "tax_postcode": "*",
            "rate": 23,
            "code": "VAT23%",
            "titles": []
          }
        ],
        "tsk": 1510603185144
      }
    }).then(res2 => {
      console.dir(res2, { depth: null, colors: true })
      next()
    }).catch(err2 => {
      console.dir(err2, { depth: null, colors: true })
    })
  }).catch(err1 => {
    console.dir(err1, { depth: null, colors: true })
  })
}

module.exports.down = next => {
  next()
}
