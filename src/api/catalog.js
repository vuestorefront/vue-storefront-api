let request = require('request');

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
    //do somethings
    // TODO: Add signatures there
    res.json(_resBody);
  });


}
