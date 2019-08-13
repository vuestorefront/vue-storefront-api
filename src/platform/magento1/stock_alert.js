import AbstractStockAlertProxy from '../abstract/stock_alert';
import { multiStoreConfig } from './util';

class StockAlertProxy extends AbstractStockAlertProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  subscribe (customerToken, productId, emailAddress) {
    return this.api.stockAlert.subscribe(customerToken, productId, emailAddress);
  }
}

module.exports = StockAlertProxy;
