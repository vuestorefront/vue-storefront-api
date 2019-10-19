import { apiStatus, apiError } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';

export default ({ config, db }) => {
  let cartApi = Router()

  const _getCartProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'cart')
  };

  const _getStockProxy = (req) => {
    const platform = config.platform
    const factory = new PlatformFactory(config, req)
    return factory.getAdapter(platform, 'stock')
  }

  const _getStockId = (storeCode) => {
    let storeView = config.storeViews[storeCode]
    return storeView ? storeView.msi.stockId : config.defaultStockId
  }

  cartApi.post('/create', (req, res) => {
    const cartProxy = _getCartProxy(req)
    cartProxy.create(req.query.token).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  cartApi.post('/add', async (req, res) => {
    const cartId = req.query.cartId ? req.query.cartId : null
    const cartProxy = _getCartProxy(req)
    const stockProxy = _getStockProxy(req)
    const products = req.body
    const userToken = req.query.token || ''

    for (let product of products) {
      const stockResponse = await stockProxy.check({
        sku: product.sku,
        stockId: _getStockId(req.params.storeCode)
      })

      if (stockResponse.is_in_stock) {
        await cartProxy.update(userToken, cartId, product)
      }
    }

    const pullResponse = await cartProxy.pull(userToken, cartId, req.body)
    apiStatus(res, pullResponse, 200);
  })

  return cartApi
}
