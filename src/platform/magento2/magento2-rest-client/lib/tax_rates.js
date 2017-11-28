var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (rateId) {
        var endpointUrl = util.format('/taxRates/%d', rateId);
        return restClient.get(endpointUrl);
    }
    
    module.create = function (rateAttributes) {
        return restClient.post('/taxRates', rateAttributes);
    }

    module.update = function (rateId, rateAttributes) {
        var endpointUrl = util.format('/taxRates/%d', rateId);
        return restClient.put(endpointUrl, rateAttributes);
    }

    module.delete = function (rateId) {
        var endpointUrl = util.format('/taxRates/%d', rateId);
        return restClient.delete(endpointUrl);
    }

    return module;
}
