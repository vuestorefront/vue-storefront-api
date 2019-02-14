import AbstractUserProxy from '../abstract/user'
import { multiStoreConfig } from './util'

class StockProxy extends AbstractUserProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  check (sku) {
    return this.api.stockItems.list(sku)
  }

  // MSI
  getSalableQty (sku, stockId) {
    return this.api.stockItems.getSalableQty(sku, stockId)
  }

  // MSI
  isSalable (sku, stockId) {
    return this.api.stockItems.isSalable(sku, stockId)
  }
}

module.exports = StockProxy
