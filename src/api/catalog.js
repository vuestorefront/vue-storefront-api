import jwt from "jwt-simple";

const request = require('request');
import ProcessorFactory from '../processor/factory'

export default ({config, db}) => function (req, res, body) {
	let groupId = null

	// Request method handling: exit if not GET or POST
	// Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
	if (!(req.method == 'GET' || req.method == 'POST' || req.method == 'OPTIONS')) {
		throw new Error('ERROR: ' + req.method + ' request method is not supported.')
	}

	const urlSegments = req.url.split('/');

	const _getTaxProxy = () => {
	};

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
	}

	// pass the request to elasticsearch
	let url = 'http://' + config.elasticsearch.host + ':' + config.elasticsearch.port + req.url;

	// Check price tiers
	if (config.usePriceTiers) {
		const userToken = req.body.token

		// Decode token and get group id
        if (userToken && userToken.length > 10) {
		// if (userToken && userToken.length > 10) {
			const decodeToken = jwt.decode(userToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret)
			groupId = decodeToken.group_id || groupId
		}

		delete req.body.token
	}

	request({ // do the elasticsearch request
		uri: url,
		method: req.method,
		body: req.body,
		json: true,
		auth: {
			user: config.elasticsearch.user,
			pass: config.elasticsearch.password
		},
	}, function (_err, _res, _resBody) { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
		if (_resBody && _resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)

			const factory = new ProcessorFactory(config)
			let resultProcessor = factory.getAdapter(entityType, indexName)

			if (!resultProcessor)
				resultProcessor = factory.getAdapter('default', indexName) // get the default processor

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


		} else
			res.json(_resBody);
	});
}
