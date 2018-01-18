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
        return this.api.customers.token(userData)
    } 

    me (requestToken) { 
        return this.api.customers.me(requestToken)
    }        
    
    resetPassword (emailData) { 
        return this.api.customers.resetPassword(emailData)
    }       

    update (userData) {
        return this.api.customers.update(userData)
    }

    changePassword (passwordData) {
        return this.api.customers.changePassword(passwordData)
    }
}

module.exports = UserProxy