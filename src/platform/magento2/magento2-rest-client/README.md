# Magento2 REST client

This Node.js library enables JavaScript applications to communicate with Magento2 sites using their REST API.

**NOTE: the library is not finished yet! Only a subset of Magento2 API is currently implemented.**

## Installation

The library can be installed using the Npm package manager:

```
    npm install magento2-rest-client
```

## Usage

The code sample below shows the usage of the library:

```javascript
    var Magento2Client = require('magento2-rest-client').Magento2Client;

    var options = {
          'url': 'http://www.test.com/index.php/rest',
          'consumerKey': '<OAuth 1.0a consumer key>',
          'consumerSecret': '<OAuth 1.0a consumer secret>',
          'accessToken': '<OAuth 1.0a access token>',
          'accessTokenSecret': '<OAuth 1.0a access token secret>'
    };
    var client = Magento2Client(options);
    client.categories.list()
        .then(function (categories) {
            assert.equal(categories.parentId, 1);
        })
```