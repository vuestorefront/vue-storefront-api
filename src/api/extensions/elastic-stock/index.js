import { apiStatus, getCurrentStoreView, getCurrentStoreCode } from '../../../lib/util';
import { getClient as getElasticClient, adjustQuery, getHits } from '../../../lib/elastic'
import { Router } from 'express';
const bodybuilder = require('bodybuilder')

module.exports = ({
  config,
  db
}) => {
  let api = Router();

  const getStockList = (storeCode, skus) => {
    let storeView = getCurrentStoreView(storeCode)
    const esQuery = adjustQuery({
      index: storeView.elasticsearch.index, // current index name
      type: 'product',
      _source_includes: ['stock'],
      body: bodybuilder().filter('term', 'status', 1).andFilter('terms', 'sku', skus).build()
    }, 'product', config)
    return getElasticClient(config).search(esQuery).then((products) => { // we're always trying to populate cache - when online
      return getHits(products).map(el => { return el._source.stock })
    }).catch(err => {
      console.error(err)
    })
  }

  /**
   * GET get stock item
   */
  api.get('/check/:sku', (req, res) => {
    if (!req.params.sku) {
      return apiStatus(res, 'sku parameter is required', 500);
    }

    getStockList(getCurrentStoreCode(req), [req.params.sku]).then((result) => {
      if (result && result.length > 0) {
        apiStatus(res, result[0], 200);
      } else {
        apiStatus(res, 'No stock information for given sku', 500);
      }
    }).catch(err => {
      apiStatus(res, err, 500);
    })
  })

  /**
  * GET get stock item - 2nd version with the query url parameter
  */
  api.get('/check', (req, res) => {
    if (!req.query.sku) {
      return apiStatus(res, 'sku parameter is required', 500);
    }
    getStockList(getCurrentStoreCode(req), [req.query.sku]).then((result) => {
      if (result && result.length > 0) {
        apiStatus(res, result[0], 200);
      } else {
        apiStatus(res, 'No stock information for given sku', 500);
      }
    }).catch(err => {
      apiStatus(res, err, 500);
    })
  })

  /**
  * GET get stock item list by skus (comma separated)
  */
  api.get('/list', (req, res) => {
    if (!req.query.skus) {
      return apiStatus(res, 'skus parameter is required', 500);
    }
    const skuArray = req.query.skus.split(',')
    getStockList(getCurrentStoreCode(req), skuArray).then((result) => {
      if (result && result.length > 0) {
        apiStatus(res, result, 200);
      } else {
        apiStatus(res, 'No stock information for given sku', 500);
      }
    }).catch(err => {
      apiStatus(res, err, 500);
    })
  })

  return api
}
