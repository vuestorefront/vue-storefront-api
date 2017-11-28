var chai = require('chai');
var credentials = require('../config');
var assert = chai.assert;

var Magento2Client = require('../../index').Magento2Client;

suite('products tests', function () {
    var client;

    before(function() {
        client = Magento2Client(credentials);
    });

    test('list products test', function (done) {
        client.products.list('Test')
            .then(function (products) {
                assert.isTrue(products.totalCount > 0);
            })
            .then(done, done);
    });

    test('create product test', function (done) {
        var newProduct = {
            product: {
                'sku': 'test123',
                'name': 'Integration test product',
                'typeId': 'simple',
                'price': 12.3,
                'attributeSetId': 4,
                'status': 1,
                'visibility': 4,
            }
        };
        client.products.create(newProduct)
            .then(function (result) {
                assert.equal(result.name, 'Integration test product');
            })
            .then(done, done);
    });

    test('update product test', function (done) {
        var productUpdate = {
            product: {
                'sku': 'test123',
                'name': 'Integration test product updated',
                'typeId': 'simple',
                'price': 12.3,
                'attributeSetId': 4,
                'status': 1,
                'visibility': 4,
            }
        };
        client.products.update('test123', productUpdate)
            .then(function (result) {
                assert.equal(result.name, 'Integration test product updated');
            })
            .then(done, done);
    });

    test('delete product test', function (done) {
        client.products.delete(23)
            .then(function (result) {
                assert.isTrue(result);
            })
            .then(done, done);
    })
});

