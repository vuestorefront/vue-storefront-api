var chai = require('chai');
var credentials = require('../config');
var assert = chai.assert;

var Magento2Client = require('../../index').Magento2Client;

suite('products media tests', function () {
    var client;

    before(function () {
        client = Magento2Client(credentials);
    });

    test('list product media test', function (done) {
        client.productMedia.list('test123')
            .then(function (productMedia) {
                assert.isTrue(productMedia.length > 0);
            })
            .then(done, done);
    });

    test('get product media test', function (done) {
        client.productMedia.get('test123', 15)
            .then(function (productMedia) {
                assert.isNotNull(productMedia);
            })
            .then(done, done);
    });

    test('create product media test', function (done) {
        var newProductMedia = {
            'entry': {
                'media_type': 'image',
                'label': 'Image',
                'position': 1,
                'disabled': false,
                'types': [
                    'image',
                    'small_image',
                    'thumbnail'
                ],
                'file': '/m/b/mb01-blue-0.png',
                'content': {
                    'base64EncodedData': 'iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAWtJREFUeNpi/P//P8NgBkwMgxyMOnDUgTDAyMhIDNYF4vNA/B+IDwCxHLoakgEoFxODiQRXQUYi4e3k2gfDjMRajsP3zED8F8pmA+JvUDEYeArEMugOpFcanA/Ef6A0CPwC4uNoag5SnAjJjGI2tKhkg4rLAfFGIH4IxEuBWIjSKKYkDfZCHddLiwChVhokK8YGohwEZYy3aBmEKmDEhOCgreomo+VmZHxsMEQxIc2MAx3FO/DI3RxMmQTZkI9ALDCaSUYdOOrAIeRAPzQ+PxCHUM2FFDb5paGNBPRa5C20bUhxc4sSB4JaLnvxVHWHsbVu6OnACjyOg+HqgXKgGRD/JMKBoD6LDb0dyAPE94hwHAw/hGYcujlwEQmOg+EV9HJgLBmOg+FMWjsQVKR8psCBoDSrQqoDSSmoG6Hpj1wA6ju30LI9+BBX4UsC+Ai0T4BWVd1EIL5PgeO+APECmoXgaGtm1IE0AgABBgAJAICuV8dAUAAAAABJRU5ErkJggg==',
                    'type': 'image/png',
                    'name': 'new_image.png'
                }
            }
        };
        client.productMedia.create('test123', newProductMedia)
            .then(function (result) {
                assert.isNotNull(result);
            })
            .then(done, done);
    });

    test('update product test', function (done) {
        var productMediaUpdate = {
                'entry': {
                    'id': 15,
                    'label': 'Image updated',
                }
            };
        client.productMedia.update('test123', 15, productMediaUpdate)
            .then(function (result) {
                assert.isNotNull(result);
            })
            .then(done, done);
    });

    test('delete product test', function (done) {
        client.productMedia.delete('test123', 10)
            .then(function (result) {
                assert.isTrue(result);
            })
            .then(done, done);
    })
});

