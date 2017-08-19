let request = require('request');
 
export default ({ config, db }) => function(req, res, body) {

  // Request method handling: exit if not GET or POST
  // Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
  if ( ! (req.method == 'GET' || req.method == 'POST') ) {
    const errMethod = { error: req.method + " request method is not supported. Use GET or POST." };
    console.log("ERROR: " + req.method + " request method is not supported.");
    res.write(JSON.stringify(errMethod));
    res.end();
    return;
  }

  if (!config.esIndexName){
    res.end(res.write(JSON.stringify({ error: "ElasticSearch index name or ElasticSearch URL not configured (esIndexName, esUrl)" })));
    return;

  }
  // pass the request to elasticsearch
  var url = config.esUrl + '/' + config.esIndexName + req.url;
    req.pipe(request({
      uri  : url,
      auth : {
        user : 'username',
        pass : 'password'
      },
      headers: {
      'accept-encoding': 'none'
      },
      rejectUnauthorized : false,
    }, function(err, res, body) {
    // you could do something here before returning the response
    })).pipe(res); // return the elasticsearch results to the user
}
	