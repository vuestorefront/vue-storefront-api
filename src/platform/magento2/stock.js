import AbstractUserProxy from '../abstract/user'
import { multiStoreConfig } from './util'

class StockProxy extends AbstractUserProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  check ({sku, stockId}) {
    return this.api.stockItems.list(sku).then((result) => {
      if (this._config.storeViews.msi) {
        return this.api.stockItems.getSalableQty(sku, 1).then((salableQty) => {
          result.qty = salableQty;
          return result;
        }).then((result) => {
          return this.api.stockItems.isSalable(sku, 1).then((isSalable) => {
            result.is_in_stock = isSalable;
            return result
          })
        })
      } else {
        return result;
      }
    })
  }
}

module.exports = StockProxy
