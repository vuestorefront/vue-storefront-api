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
}

module.exports = StockProxy