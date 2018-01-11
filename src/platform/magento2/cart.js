import AbstractCartProxy from '../abstract/cart'


class CartProxy extends AbstractCartProxy {
    constructor (config){
        const Magento2Client = require('./magento2-rest-client').Magento2Client;
        super(config)
        this.api = Magento2Client(config.magento2.api);
    }       



    create (customerToken) { 
        return this.api.cart.create(customerToken)
    }        
    
    update (customerToken, cartItem) { 
        return this.api.cart.update(customerToken, cartItem)
    }       

    delete (customerToken, cartItem) { 
        return this.api.cart.update(customerToken, cartItem)
    }        
}

module.exports = CartProxy