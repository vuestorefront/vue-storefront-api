import AbstractProductProxy from '../abstract/product'


class ProductProxy extends AbstractProductProxy {
    constructor (config){
        const Magento2Client = require('magento2-rest-client').Magento2Client;
        super(config)
        this.api = Magento2Client(config.magento2.api);
    }       

    renderList (skus, currencyCode) { 
        const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
        'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
        'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
        return this.api.products.renderList(query, currencyCode)
    }
    list (skus) { 
        const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
        'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
        'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
        return this.api.products.list(query)
    }
    
}

module.exports = ProductProxy