class AbstractProductProxy {
  constructor (config, req) {
    this._config = config
    this._request = req
  }

  list (skus) {
    throw new Error('ProductProxy::list must be implemented for specific platform')
  }
}

export default AbstractProductProxy
