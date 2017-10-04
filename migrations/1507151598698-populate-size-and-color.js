// Migration scripts use: https://github.com/tj/node-migrate
'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = function (next) {

  // common.db = elasticsearch-js elastic client: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
  // add product programmaticaly
  common.db.create({
    index: config.esIndexes[0],
    type: 'attribute',
    id: '201',
    body: {
      "is_wysiwyg_enabled": false,
      "is_html_allowed_on_front": false,
      "used_for_sort_by": false,
      "is_filterable": false,
      "is_filterable_in_search": false,
      "is_used_in_grid": false,
      "is_visible_in_grid": false,
      "is_filterable_in_grid": false,
      "position": 0,
      "apply_to": [],
      "is_searchable": "0",
      "is_visible_in_advanced_search": "0",
      "is_comparable": "0",
      "is_used_for_promo_rules": "0",
      "is_visible_on_front": "0",
      "used_in_product_listing": "0",
      "is_visible": true,
      "scope": "global",
      "attribute_id": 115,
      "attribute_code": "size",
      "frontend_input": "select",
      "entity_type_id": "4",
      "is_required": false,
      "options": [
        {
          "value": 168,
          "label": 274
          }
          ,
          {
          "key": 169,
          "label": 274
          }
          ,
          {
          "value": 170,
          "label": 274
          }
          ,
          {
          "value": 167,
          "label": 271
          }
          ,
          {
          "value": 171,
          "label": 271
          }
          ,
          {
          "value": 176,
          "label": 85
          }
          ,
          {
          "value": 177,
          "label": 70
          }
          ,
          {
          "value": 178,
          "label": 70
          }
          ,
          {
          "value": 179,
          "label": 70
          }
          ,
          {
          "value": 172,
          "label": 60
          }      ],
      "is_user_defined": false,
      "default_frontend_label": "Size",
      "frontend_labels": null,
      "backend_type": "int",
      "default_value": "1",
      "is_unique": "0",
      "validation_rules": [],
    }


  }).then((response) => {
    console.dir(response);
  })


  common.db.create({
    index: config.esIndexes[0],
    type: 'attribute',
    id: '201',
    body: {
      "is_wysiwyg_enabled": false,
      "is_html_allowed_on_front": false,
      "used_for_sort_by": false,
      "is_filterable": false,
      "is_filterable_in_search": false,
      "is_used_in_grid": false,
      "is_visible_in_grid": false,
      "is_filterable_in_grid": false,
      "position": 0,
      "apply_to": [],
      "is_searchable": "0",
      "is_visible_in_advanced_search": "0",
      "is_comparable": "0",
      "is_used_for_promo_rules": "0",
      "is_visible_on_front": "0",
      "used_in_product_listing": "0",
      "is_visible": true,
      "scope": "global",
      "attribute_id": 115,
      "attribute_code": "size",
      "frontend_input": "select",
      "entity_type_id": "4",
      "is_required": false,
      "options": [
        {
          "value": 50,
          "label": 35
          }
          ,
          {
          "value": 53,
          "label": 30
          }
          ,
          {
          "value": 57,
          "label": 30
          }
          ,
          {
          "value": 49,
          "label": 25
          }
          ,
          {
          "value": 56,
          "label": 25
          }
          ,
          {
          "value": 58,
          "label": 15
          }
          ,
          {
          "value": 52,
          "label": 10
          }
          ,
          {
          "value": 51,
          "label": 5
          }
          ,
          {
          "value": 54,
          "label": 5
          }
          ,
          {
          "value": 59,
          "label": 5
          }     ],
      "is_user_defined": false,
      "default_frontend_label": "Size",
      "frontend_labels": null,
      "backend_type": "int",
      "default_value": "1",
      "is_unique": "0",
      "validation_rules": [],
    }


  }).then((response) => {
    console.dir(response);
  })

}

module.exports.down = function (next) {
  next()
}
