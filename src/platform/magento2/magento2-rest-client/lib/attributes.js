var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (searchCriteria) {
        var query = 'searchCriteria=' + searchCriteria;
        var endpointUrl = util.format('/products/attributes?%s', query);
        return restClient.get(endpointUrl);
    }
    
    module.create = function (categoryAttributes) {
        return restClient.post('/products/attributes', categoryAttributes);
    }

    module.update = function (attributeId, categoryAttributes) {
        var endpointUrl = util.format('/products/attributes/%d', attributeId);
        return restClient.put(endpointUrl, categoryAttributes);
    }

    module.delete = function (attributeId) {
        var endpointUrl = util.format('/products/attributes/%d', attributeId);
        return restClient.delete(endpointUrl);
    }

    return module;
}
