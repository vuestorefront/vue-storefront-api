module.exports = function (restClient) {
    var module = {};
    
    module.create = function (customerData) {
        return restClient.post('/customers', customerData);
    }
    return module;
}
