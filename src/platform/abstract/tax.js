class AbstractTaxProxy {
  constructor (config, req) {
    this._config = config
    this._request = req
  }

  taxFor (product) {
    throw new Error('TaxProxy::taxFor must be implemented for specific platform')
  }

  /**
   * @param Array productList
   * @returns Promise
   */
  process (productList, groupId = null) {
    throw new Error('TaxProxy::process must be implemented for specific platform')
  }
}

export default AbstractTaxProxy
