// Migration scripts use: https://github.com/tj/node-migrate
'use strict'

let config = require('../src/config.json')
let common = require('./.common')

module.exports.up = function (next) {


  /**
   *
   * Size:
   * 
   * {
"key": 168,
"doc_count": 274
}
,
{
"key": 169,
"doc_count": 274
}
,
{
"key": 170,
"doc_count": 274
}
,
{
"key": 167,
"doc_count": 271
}
,
{
"key": 171,
"doc_count": 271
}
,
{
"key": 176,
"doc_count": 85
}
,
{
"key": 177,
"doc_count": 70
}
,
{
"key": 178,
"doc_count": 70
}
,
{
"key": 179,
"doc_count": 70
}
,
{
"key": 172,
"doc_count": 60
}
   * 
   * 
   *  Color:
   * "buckets": [
{
"key": 50,
"doc_count": 35
}
,
{
"key": 53,
"doc_count": 30
}
,
{
"key": 57,
"doc_count": 30
}
,
{
"key": 49,
"doc_count": 25
}
,
{
"key": 56,
"doc_count": 25
}
,
{
"key": 58,
"doc_count": 15
}
,
{
"key": 52,
"doc_count": 10
}
,
{
"key": 51,
"doc_count": 5
}
,
{
"key": 54,
"doc_count": 5
}
,
{
"key": 59,
"doc_count": 5
}

   */

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
      "attribute_code": "quantity_and_stock_status",
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
      "default_frontend_label": "Quantity",
      "frontend_labels": null,
      "backend_type": "int",
      "backend_model": "Magento\Catalog\Model\Product\Attribute\Backend\Stock",
      "source_model": "Magento\CatalogInventory\Model\Source\Stock",
      "default_value": "1",
      "is_unique": "0",
      "validation_rules": [],
      "id": 115,
      "tsk": 1507144980227
    }


  }).then((response) => {


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
