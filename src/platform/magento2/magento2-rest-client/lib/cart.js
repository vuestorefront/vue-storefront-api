module.exports = function (restClient) {
    var module = {};
    
    module.create = function (customerToken) {
        if (customerToken) {
            return restClient.post('/carts/mine', {}, customerToken);
        } else 
        {
            return restClient.post('/guest-carts');
        }
    }    
    return module;
}
