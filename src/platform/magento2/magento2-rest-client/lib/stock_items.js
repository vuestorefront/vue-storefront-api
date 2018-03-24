var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (sku) {
        var endpointUrl = util.format('/stockItems/%s', encodeURIComponent(sku));
        return restClient.get(endpointUrl);
    }


    return module;
}
