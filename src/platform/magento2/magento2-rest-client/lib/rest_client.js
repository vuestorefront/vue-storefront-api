'use strict';

var OAuth = require('oauth-1.0a');
var request = require('request');
var humps = require('humps');
var sprintf = require('util').format;

var logger = require('./log');

module.exports.RestClient = function (options) {
    var instance = {};

    var servelrUrl = options.url;
    var apiVersion = options.version;
    var oauth = OAuth({
        consumer: {
            public: options.consumerKey,
            secret: options.consumerSecret
        },
        signature_method: 'HMAC-SHA1'
    });
    var token = {
        public: options.accessToken,
        secret: options.accessTokenSecret
    };

    function apiCall(request_data) {
        logger.debug('Calling API endpoint: ' + request_data.method + ' ' + request_data.url);
        return new Promise(function (resolve, reject) {
            request({
                url: request_data.url,
                method: request_data.method,
                headers: oauth.toHeader(oauth.authorize(request_data, token)),
                json: true,
                body: request_data.body,
            }, function (error, response, body) {
                logger.debug('Response received.');
                if (error) {
                    logger.error('Error occured: ' + error);
                    reject(error);
                    return;
                } else if (!httpCallSucceeded(response)) {
                    var errorMessage = 'HTTP ERROR ' + response.code;
                    if(body && body.hasOwnProperty('message') )
                        errorMessage = errorString(body.message, body.hasOwnProperty('parameters') ? body.parameters : {});
                    
                    logger.error('API call failed: ' + errorMessage);
                    reject(errorMessage);
                }
//                var bodyCamelized = humps.camelizeKeys(body);
//                resolve(bodyCamelized);
                resolve(body);
            });
        });
    }

    function httpCallSucceeded(response) {
        return response.statusCode >= 200 && response.statusCode < 300;
    }

    function errorString(message, parameters) {
        if (parameters === null) {
            return message;
        }
        if (parameters instanceof Array) {
            for (var i = 0; i < parameters.length; i++) {
                var parameterPlaceholder = '%' + (i + 1).toString();
                message = message.replace(parameterPlaceholder, parameters[i]);
            }
        } else if (parameters instanceof Object) {
            for (var key in parameters) {
                var parameterPlaceholder = '%' + key;
                message = message.replace(parameterPlaceholder, parameters[key]);
            }
        }

        return message;
    }

    instance.get = function (resourceUrl) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'GET'
        };
        return apiCall(request_data);
    }

    function createUrl(resourceUrl) {
        return servelrUrl + '/' + apiVersion + resourceUrl;
    }

    instance.post = function (resourceUrl, data) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'POST',
            body: data
        };
        return apiCall(request_data);
    }

    instance.put = function (resourceUrl, data) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'PUT',
            body: data
        };
        return apiCall(request_data);
    }

    instance.delete = function (resourceUrl) {
        var request_data = {
            url: createUrl(resourceUrl),
            method: 'DELETE'
        };
        return apiCall(request_data);
    }

    return instance;
}
