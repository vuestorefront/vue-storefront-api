var util = require('util');
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
    module.orderHistory = function (requestToken) {
        
        return restClient.get('/customers/me', requestToken).then((result) => {
            var query = 'searchCriteria=&searchCriteria[filter_groups][0][filters][0][field]=customer_email&' +
            'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(result.email) + '&' +
            'searchCriteria[filter_groups][0][filters][0][condition_type]=eq&searchCriteria[pageSize]=20';
            var endpointUrl = util.format('/orders?%s', query);
            return restClient.get(endpointUrl);            
        })
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
