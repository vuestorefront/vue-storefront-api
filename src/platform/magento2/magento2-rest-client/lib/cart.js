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
    module.update = function (customerToken, cartId, cartItem) {
        if (customerToken) {
            return restClient.post('/carts/mine/items', { cartItem: cartItem }, customerToken);
        } else 
        {
            console.log(cartId)
            return restClient.post('/guest-carts/' + cartId + '/items', { cartItem: cartItem });
        }
    }    
    module.delete = function (customerToken, cartId, cartItem) {
        if (customerToken) {
            return restClient.delete('/carts/mine/items/' + cartItem.item_id, customerToken);
        } else 
        {
            return restClient.delete('/guest-carts/' + cartId + '/items/' + cartItem.item_id);
        }
    }     
    module.pull = function (customerToken, cartId, params) {
        if (customerToken) {
            return restClient.get('/carts/mine/items', customerToken);
        } else 
        {
            return restClient.get('/guest-carts/' + cartId + '/items/');
        }
    }                
    return module;
}
