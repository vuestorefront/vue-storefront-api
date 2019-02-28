import AbstractUserProxy from '../abstract/user';
import { multiStoreConfig } from './util';
import { Magento1Client } from './module/index';

class StockProxy extends AbstractUserProxy {
  constructor (config, req){
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  check (sku) {
    return this.api.stock.check(sku);
  }
}

module.exports = StockProxy;
