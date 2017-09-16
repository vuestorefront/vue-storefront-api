let request = require('request');
 
export default ({ config, db }) => function(req, res, body) {

  // Image proxy for products
  if ( ! (req.method == 'GET' ) ) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')
    
  }

  const elasticsearch = require('elasticsearch');
  const client = new elasticsearch.Client({
    host: config.esHost,
    log: 'trace'
  });




}
	