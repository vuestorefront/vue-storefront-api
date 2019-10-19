import { apiStatus, apiError } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';

export default ({ config, db }) => {
  let cartApi = Router();

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

  /**
   * POST create a cart
   * req.query.token - user token
   */
  cartApi.post('/create', (req, res) => {
    const cartProxy = _getCartProxy(req)
    cartProxy.create(req.query.token).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST update or add the cart item
   *   req.query.token - user token
   *   body.cartItem: {
   *    sku: orderItem.sku,
   *    qty: orderItem.qty,
   *   quoteId: cartKey}
   */
  cartApi.post('/update', (req, res) => {
    const cartProxy = _getCartProxy(req)
    if (!req.body.cartItem) {
      return apiStatus(res, 'No cartItem element provided within the request body', 500)
    }
    cartProxy.update(req.query.token, req.query.cartId ? req.query.cartId : null, req.body.cartItem).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST apply the coupon code
   *   req.query.token - user token
   *   req.query.cartId - cart Ids
   *   req.query.coupon - coupon
   */
  cartApi.post('/apply-coupon', (req, res) => {
    const cartProxy = _getCartProxy(req)
    if (!req.query.coupon) {
      return apiStatus(res, 'No coupon code provided', 500)
    }
    cartProxy.applyCoupon(req.query.token, req.query.cartId ? req.query.cartId : null, req.query.coupon).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST remove the coupon code
   *   req.query.token - user token
   *   req.query.cartId - cart Ids
   */
  cartApi.post('/delete-coupon', (req, res) => {
    const cartProxy = _getCartProxy(req)
    cartProxy.deleteCoupon(req.query.token, req.query.cartId ? req.query.cartId : null).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET get the applied coupon code
   *   req.query.token - user token
   *   req.query.cartId - cart Ids
   */
  cartApi.get('/coupon', (req, res) => {
    const cartProxy = _getCartProxy(req)
    cartProxy.getCoupon(req.query.token, req.query.cartId ? req.query.cartId : null).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST delete the cart item
   *   req.query.token - user token
   *   body.cartItem: {
   *    sku: orderItem.sku,
   *    qty: orderItem.qty,
   *   quoteId: cartKey}
   */
  cartApi.post('/delete', (req, res) => {
    const cartProxy = _getCartProxy(req)
    if (!req.body.cartItem) {
      return apiStatus(res, 'No cartItem element provided within the request body', 500)
    }
    cartProxy.delete(req.query.token, req.query.cartId ? req.query.cartId : null, req.body.cartItem).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET pull the whole cart as it's currently se server side
   *   req.query.token - user token
   *   req.query.cartId - cartId
   */
  cartApi.get('/pull', (req, res) => {
    const cartProxy = _getCartProxy(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    cartProxy.pull(req.query.token, req.query.cartId ? req.query.cartId : null, req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET totals the cart totals
   *   req.query.token - user token
   *   req.query.cartId - cartId
   */
  cartApi.get('/totals', (req, res) => {
    const cartProxy = _getCartProxy(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    cartProxy.totals(req.query.token, req.query.cartId ? req.query.cartId : null, req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST /shipping-methods - available shipping methods for a given address
   *   req.query.token - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   *   req.body.address - shipping address object
   */
  cartApi.post('/shipping-methods', (req, res) => {
    const cartProxy = _getCartProxy(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    if (!req.body.address) {
      return apiStatus(res, 'No address element provided within the request body', 500)
    }
    cartProxy.getShippingMethods(req.query.token, req.query.cartId ? req.query.cartId : null, req.body.address).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * GET /payment-methods - available payment methods
   *   req.query.token - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   */
  cartApi.get('/payment-methods', (req, res) => {
    const cartProxy = _getCartProxy(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    cartProxy.getPaymentMethods(req.query.token, req.query.cartId ? req.query.cartId : null).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST /shipping-information - set shipping information for collecting cart totals after address changed
   *   req.query.token - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   *   req.body.addressInformation - shipping address object
   */
  cartApi.post('/shipping-information', (req, res) => {
    const cartProxy = _getCartProxy(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    if (!req.body.addressInformation) {
      return apiStatus(res, 'No address element provided within the request body', 500)
    }
    cartProxy.setShippingInformation(req.query.token, req.query.cartId ? req.query.cartId : null, req.body).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  /**
   * POST /collect-totals - collect cart totals after shipping address changed
   *   req.query.token - user token
   *   req.query.cartId - cart ID if user is logged in, cart token if not
   *   req.body.shippingMethod - shipping and payment methods object
   */
  cartApi.post('/collect-totals', (req, res) => {
    const cartProxy = _getCartProxy(req)
    res.setHeader('Cache-Control', 'no-cache, no-store');
    if (!req.body.methods) {
      return apiStatus(res, 'No shipping and payment methods element provided within the request body', 500)
    }
    cartProxy.collectTotals(req.query.token, req.query.cartId ? req.query.cartId : null, req.body.methods).then((result) => {
      apiStatus(res, result, 200);
    }).catch(err => {
      apiError(res, err);
    })
  })

  // NEW API

  cartApi.post('/add', async (req, res) => {
    const cartProxy = _getCartProxy(req)
    const stockProxy = _getStockProxy(req)
    const products = req.body
    const cartId = req.query.cartId ? req.query.cartId : null
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
