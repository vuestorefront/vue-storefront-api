import AbstractOrderProxy from '../abstract/order'
import { multiStoreConfig } from './util'

class OrderProxy extends AbstractOrderProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }

  create (orderData) {
    return this.api.order.create(orderData);
  }
}

module.exports = OrderProxy
