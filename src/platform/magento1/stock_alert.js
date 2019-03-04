import AbstractStockAlertProxy from '../abstract/stock_alert';
import { multiStoreConfig } from './util';
import { Magento1Client } from './module/index';

class StockAlertProxy extends AbstractStockAlertProxy {
  constructor (config, req){
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  subscribe (customerToken, productId, emailAddress) {
    return this.api.stockAlert.subscribe(customerToken, productId, emailAddress);
  }
}

module.exports = StockAlertProxy;
