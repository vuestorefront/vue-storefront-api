import AbstractUserProxy from '../abstract/user'


class UserProxy extends AbstractUserProxy {
    constructor (config){
        const Magento2Client = require('./magento2-rest-client').Magento2Client;
        super(config)
        this.api = Magento2Client(config.magento2.api);
    }       

    register (userData) { 
        return this.api.customers.create(userData)
    }
    
    login (userData) { 
        throw new Error('UserProxy::login must be implemented for specific platform')
    } 
}

module.exports = UserProxy