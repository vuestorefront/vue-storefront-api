import jwt from 'jwt-simple';
import request from 'request';
import ProcessorFactory from '../processor/factory';

function _updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|#|$)", "i");
  if (uri.match(re)) {
		if (value) {
			return uri.replace(re, '$1' + key + "=" + value + '$2');
		} else {
			return uri.replace(re, '$1' + '$2');
		}
  } else {
    var hash =  '';
    if( uri.indexOf('#') !== -1 ){
        hash = uri.replace(/.*#/, '#');
        uri = uri.replace(/#.*/, '');
    }
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    return uri + separator + key + "=" + value + hash;
  }
}

export default ({config, db}) => function (req, res, body) {
	let groupId = null

	// Request method handling: exit if not GET or POST
	// Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
	if (!(req.method == 'GET' || req.method == 'POST' || req.method == 'OPTIONS')) {
		throw new Error('ERROR: ' + req.method + ' request method is not supported.')
	}

	let requestBody = {}
	if (req.method === 'GET') {
		if (req.query.request) { // this is in fact optional
			requestBody = JSON.parse(decodeURIComponent(req.query.request))
			console.log(requestBody)
		}
	} else {
		requestBody = req.body
	}

	const urlSegments = req.url.split('/');

	let indexName = ''
	let entityType = ''
	if (urlSegments.length < 2)
		throw new Error('No index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/<entity_type>_search')
	else {
		indexName = urlSegments[1];

		if (urlSegments.length > 2)
			entityType = urlSegments[2]

		if (config.elasticsearch.indices.indexOf(indexName) < 0) {
			throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
		}

		if (urlSegments[urlSegments.length - 1].indexOf('_search') !== 0) {
			throw new Error('Please do use following URL format: /api/catalog/<index_name>/_search')
		}
	}

	// pass the request to elasticsearch
	let url = config.elasticsearch.host + ':' + config.elasticsearch.port + (req.query.request ? _updateQueryStringParameter(req.url, 'request', null) : req.url)

	if (!url.startsWith('http')) {
		url = 'http://' + url
	}

	// Check price tiers
	if (config.usePriceTiers) {
		const userToken = requestBody.groupToken

		// Decode token and get group id
        if (userToken && userToken.length > 10) {
		// if (userToken && userToken.length > 10) {
			const decodeToken = jwt.decode(userToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret)
			groupId = decodeToken.group_id || groupId
		}

		delete requestBody.groupToken
	}
  
  let auth = null;
  
  // Only pass auth if configured
  if(config.elasticsearch.user || config.elasticsearch.password) {
    auth = {
			user: config.elasticsearch.user,
			pass: config.elasticsearch.password
		};
  }

	request({ // do the elasticsearch request
		uri: url,
		method: req.method,
		body: requestBody,
		json: true,
		auth: auth,
	}, function (_err, _res, _resBody) { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
		if (_resBody && _resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)

			const factory = new ProcessorFactory(config)
			let resultProcessor = factory.getAdapter(entityType, indexName, req, res)

			if (!resultProcessor)
				resultProcessor = factory.getAdapter('default', indexName, req, res) // get the default processor

      if (entityType === 'product') {
        resultProcessor.process(_resBody.hits.hits, groupId).then((result) => {
          _resBody.hits.hits = result
          res.json(_resBody);
        }).catch((err) => {
          console.error(err)
        })
      } else {
        resultProcessor.process(_resBody.hits.hits).then((result) => {
          _resBody.hits.hits = result
          res.json(_resBody);
        }).catch((err) => {
          console.error(err)
        })
      }

		} else {
			res.json(_resBody);
		}
	});
}
