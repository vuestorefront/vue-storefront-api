let request = require('request');
 
export default ({ config, db }) => function(req, res, body) {

  // Request method handling: exit if not GET or POST
  // Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
  if ( ! (req.method == 'GET' || req.method == 'POST') ) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')
    
  }

  const urlSegments = req.url.split('/');
  
  if(urlSegments.length < 2)
    throw new Error('No index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
  else {
    const indexName = urlSegments[1];

    if (config.esIndexes.indexOf(indexName) < 0){
      throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
    }
  }
  
  // pass the request to elasticsearch
  var url = 'http://' + config.esHost + req.url; 
    req.pipe(request({
      uri  : url,
      auth : {
        user : config.esUser,
        pass : config.esPassword
      },
      headers: {
      'accept-encoding': 'none'
      },
      rejectUnauthorized : false,
    }, function(err, res, body) {
    // you could do something here before returning the response
    })).pipe(res); // return the elasticsearch results to the user
}
	