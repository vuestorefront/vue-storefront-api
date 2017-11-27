let request = require('request');
const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({ config, db }) => function (req, res, body) {

  // Request method handling: exit if not GET or POST
  // Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
  if (!(req.method == 'GET' || req.method == 'POST' || req.method == 'OPTIONS')) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')

  }

  const urlSegments = req.url.split('/');

  if (urlSegments.length < 2)
    throw new Error('No index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
  else {
    const indexName = urlSegments[1];

    if (config.esIndexes.indexOf(indexName) < 0) {
      throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
    }
  }

  // pass the request to elasticsearch
  var url = 'http://' + config.esHost + req.url;

  request({ // do the elasticsearch request
    uri: url,
    method: req.method,
    body: req.body,
    json: true,
    auth : {
      user : config.esUser,
      pass : config.esPassword
    },    
  }, function (_err, _res, _resBody) {
    if (_resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
      for (let item of _resBody.hits.hits) {

        if (item._type === 'product') {
          console.log(item._source.sku + ' ' + hmac.sign({ sku: item._source.sku, price: item._source.price }, config.objHashSecret))
          item._source.sgn = hmac.sign({ sku: item._source.sku, price: item._source.price }, config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders

          if (item._source.configurable_children) {
            for (let subItem of item._source.configurable_children)
            {
              subItem.sgn = hmac.sign({ sku: subItem.sku, price: subItem.price }, config.objHashSecret); 
              console.log(subItem.sku + ' ' + subItem.sgn)
            }
          }
        } else {
          item._source.sgn = hmac.sign(item._source, config.objHashSecret);
        }
      }
    }
    res.json(_resBody);
  });


}
