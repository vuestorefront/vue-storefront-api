class AbstractStockAlertProxy {
  constructor (config, req) {
    this._config = config
    this._request = req
  }
  subscribe (customerToken, productId, emailAddress) {
    throw new Error('AbstractContactProxy::subscribe must be implemented for specific platform')
  }
}

export default AbstractStockAlertProxy
