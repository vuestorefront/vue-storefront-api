import AbstractProductProxy from '../abstract/product'
import { multiStoreConfig } from './util'

class ProductProxy extends AbstractProductProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  renderList (skus, currencyCode, storeId = 1) {
    const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
    'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
    'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
    return this.api.products.renderList(query, currencyCode, storeId)
  }

  list (skus) {
    const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
    'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
    'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
    return this.api.products.list(query)
  }
}

module.exports = ProductProxy
