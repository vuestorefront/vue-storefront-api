import AbstractUserProxy from '../abstract/user'


class StockProxy extends AbstractUserProxy {
    constructor (config){
        const Magento2Client = require('magento2-rest-client').Magento2Client;
        super(config)
        this.api = Magento2Client(config.magento2.api);
    }       

    check (sku) { 
        return this.api.stockItems.list(sku)
    }
    
}

module.exports = StockProxy