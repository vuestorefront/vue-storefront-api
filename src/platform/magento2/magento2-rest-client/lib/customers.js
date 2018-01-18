module.exports = function (restClient) {
    var module = {};
    
    module.create = function (customerData) {
        return restClient.post('/customers', customerData);
    }

    module.token = function (loginData) {
        
        return restClient.consumerToken(loginData)
    }    

    module.me = function (requestToken) {
        
        return restClient.get('/customers/me', requestToken)
    }        

    module.resetPassword = function (emailData) {
        
        return restClient.put('/customers/password',emailData)
    }

    module.update = function (userData) {
        return restClient.put('/customers/me', userData.body, userData.token)
    }

    module.changePassword = function (passwordData) {
        return restClient.put('/customers/me/password', passwordData.body, passwordData.token)
    }
    
    return module;
}
