import { apiStatus, sgnSrc, apiError } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';

const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({ config, db }) => {
  let productApi = Router();

  const _getProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'product')
  };

  /**
   * GET get products info
   */
  productApi.get('/list', (req, res) => {
    const productProxy = _getProxy(req)

    if (!req.query.skus) { return apiStatus(res, 'skus parameter is required', 500); }

    productProxy.list((req.query.skus as string).split(',')).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET get products info
   */
  productApi.get('/render-list', (req, res) => {
    const productProxy = _getProxy(req)

    if (!req.query.skus) { return apiStatus(res, 'skus parameter is required', 500); }

    productProxy.renderList((req.query.skus as string).split(','), req.query.currencyCode, (req.query.storeId && parseInt((req.query.storeId as string)) > 0) ? req.query.storeId : 1).then((result) => {
      result.items = result.items.map((item) => {
        let sgnObj = item
        if (config.tax.calculateServerSide === true) {
          sgnObj = { priceInclTax: item.price_info.final_price }
        } else {
          sgnObj = { price: item.price_info.extension_attributes.tax_adjustments.final_price }
        }

        item.sgn = hmac.sign(sgnSrc(sgnObj, item), config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
        return item
      })
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  return productApi
}
