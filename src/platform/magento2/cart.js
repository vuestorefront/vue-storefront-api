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
    
    update (customerToken, cartId, cartItem) { 
        return this.api.cart.update(customerToken, cartId, cartItem)
    }       

    delete (customerToken, cartId, cartItem) { 
        return this.api.cart.delete(customerToken, cartId, cartItem)
    }        
    pull (customerToken, cartId,  params) { 
        return this.api.cart.pull(customerToken, cartId, params)
    }        
    
}

module.exports = CartProxy