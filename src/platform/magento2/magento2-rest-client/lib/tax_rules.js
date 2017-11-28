var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (searchCriteria) {
        var query = 'searchCriteria=' + searchCriteria;
        var endpointUrl = util.format('/taxRules/search?%s', query);
        return restClient.get(endpointUrl);
    }
    
    module.create = function (ruleAttributes) {
        return restClient.post('/taxRules', ruleAttributes);
    }

    module.update = function (ruleId, ruleAttributes) {
        var endpointUrl = util.format('/taxRules/%d', ruleId);
        return restClient.put(endpointUrl, ruleAttributes);
    }

    module.delete = function (ruleId) {
        var endpointUrl = util.format('/taxRules/%d', ruleId);
        return restClient.delete(endpointUrl);
    }

    return module;
}
