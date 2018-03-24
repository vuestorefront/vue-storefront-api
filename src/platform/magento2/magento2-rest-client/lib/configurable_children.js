var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (sku) {
        var endpointUrl = util.format('/configurable-products/%s/children', encodeURIComponent(sku));
        return restClient.get(endpointUrl);
    }


    return module;
}
