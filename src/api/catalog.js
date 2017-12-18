const request = require('request');
const es = require('elasticsearch')
const bodybuilder = require('bodybuilder')

import { calculateTaxes, calculateProductTax } from '../lib/tax'

const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({ config, db }) => function (req, res, body) {

  // Request method handling: exit if not GET or POST
  // Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
  if (!(req.method == 'GET' || req.method == 'POST' || req.method == 'OPTIONS')) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')

  }

  const urlSegments = req.url.split('/');

  let indexName = ''
  let entityType =''
  if (urlSegments.length < 2)
    throw new Error('No index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/<entity_type>_search')
  else {
    indexName = urlSegments[1];

  if (urlSegments.length > 2)
    entityType = urlSegments[2]

    if (config.esIndexes.indexOf(indexName) < 0) {
      throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
    }
  }
  
  let client = new es.Client({ // as we're runing tax calculation and other data, we need a ES indexer
    host: config.esHost,
    log: 'debug',
    apiVersion: '5.5',
    requestTimeout: 5000
  })
  
  // pass the request to elasticsearch
  let url = 'http://' + config.esHost + req.url;

  request({ // do the elasticsearch request
    uri: url,
    method: req.method,
    body: req.body,
    json: true,
    auth : {
      user : config.esUser,
      pass : config.esPassword
    },    
  }, function (_err, _res, _resBody) {
    if (_resBody && _resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
      if (entityType === 'product') { // TODO: Refactor to result processor per specific entity Type

        const esQuery = {
          index: indexName,
          type: 'taxrule',
          body: bodybuilder()
        }
        client.search(esQuery).then(function (taxClasses) { // we're always trying to populate cache - when online

          taxClasses = taxClasses.hits.hits.map(el => { return el._source })
          for (let item of _resBody.hits.hits) {
            if (config.tax.calculateServerSide === true) {
              calculateProductTax(item._source, taxClasses, config.tax.defaultCountry, config.tax.defaultRegion)
              
              item._source.sgn = hmac.sign({ sku: item._source.sku, price: item._source.price, priceInclTax: item._source.priceInclTax, special_price: item._source.special_price, special_priceInclTax:  item._source.special_priceInclTax }, config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
              if (item._source.configurable_children) {
                for (let subItem of item._source.configurable_children)
                {
                  subItem.sgn = hmac.sign({ sku: subItem.sku, price: subItem.price, priceInclTax: subItem.priceInclTax, special_price: subItem.special_price, special_priceInclTax:  subItem.special_priceInclTax }, config.objHashSecret); 
                }
              }

            } else {
              item._source.sgn = hmac.sign({ sku: item._source.sku, price: item._source.price }, config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
              if (item._source.configurable_children) {
                for (let subItem of item._source.configurable_children)
                {
                  subItem.sgn = hmac.sign({ sku: subItem.sku, price: subItem.price,  }, config.objHashSecret); 
                }
              }
            }

          }

          res.json(_resBody);
        }).catch(function (err) {
          console.log(err)
        })
      } else {
        for (let item of _resBody.hits.hits) {
          item._source.sgn = hmac.sign(item._source, config.objHashSecret);
        }        
        res.json(_resBody);
      }


    } else 
      res.json(_resBody);
    
  });


}
