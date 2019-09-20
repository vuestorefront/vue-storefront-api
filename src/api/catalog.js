import jwt from 'jwt-simple';
import request from 'request';
import ProcessorFactory from '../processor/factory';
import { adjustBackendProxyUrl } from '../lib/elastic'
import cache from '../lib/cache-instance'
import { sha3_224 } from 'js-sha3'

function _cacheStorageHandler (config, result, hash, tags) {
  if (config.server.useOutputCache && cache) {
    cache.set(
      'api:' + hash,
      result,
      tags
    ).catch((err) => {
      console.error(err)
    })
  }
}

export default ({config, db}) => function (req, res, body) {
  let groupId = null

  // Request method handling: exit if not GET or POST
  // Other metods - like PUT, DELETE etc. should be available only for authorized users or not available at all)
  if (!(req.method === 'GET' || req.method === 'POST' || req.method === 'OPTIONS')) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')
  }

  let requestBody = {}
  if (req.method === 'GET') {
    if (req.query.request) { // this is in fact optional
      requestBody = JSON.parse(decodeURIComponent(req.query.request))
    }
  } else {
    requestBody = req.body
  }

  const urlSegments = req.url.split('/');

  let indexName = ''
  let entityType = ''
  if (urlSegments.length < 2) { throw new Error('No index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/<entity_type>_search') } else {
    indexName = urlSegments[1];

    if (urlSegments.length > 2) { entityType = urlSegments[2] }

    if (config.elasticsearch.indices.indexOf(indexName) < 0) {
      throw new Error('Invalid / inaccessible index name given in the URL. Please do use following URL format: /api/catalog/<index_name>/_search')
    }

    if (urlSegments[urlSegments.length - 1].indexOf('_search') !== 0) {
      throw new Error('Please do use following URL format: /api/catalog/<index_name>/_search')
    }
  }

  // pass the request to elasticsearch
  const elasticBackendUrl = adjustBackendProxyUrl(req, indexName, entityType, config)
  const userToken = requestBody.groupToken

  // Decode token and get group id
  if (userToken && userToken.length > 10) {
    const decodeToken = jwt.decode(userToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret)
    groupId = decodeToken.group_id || groupId
  } else if (requestBody.groupId) {
    groupId = requestBody.groupId || groupId
  }

  delete requestBody.groupToken
  delete requestBody.groupId

  let auth = null;

  // Only pass auth if configured
  if (config.elasticsearch.user || config.elasticsearch.password) {
    auth = {
      user: config.elasticsearch.user,
      pass: config.elasticsearch.password
    };
  }
  const s = Date.now()
  const reqHash = sha3_224(`${JSON.stringify(requestBody)}${req.url}`)
  const dynamicRequestHandler = () => {
    request({ // do the elasticsearch request
      uri: elasticBackendUrl,
      method: req.method,
      body: requestBody,
      json: true,
      auth: auth
    }, (_err, _res, _resBody) => { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
      if (_resBody && _resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
        const factory = new ProcessorFactory(config)
        const tagsArray = []
        if (config.server.useOutputCache && cache) {
          const tagPrefix = entityType[0].toUpperCase() // first letter of entity name: P, T, A ...
          tagsArray.push(entityType)
          _resBody.hits.hits.map(item => {
            if (item._source.id) { // has common identifier
              tagsArray.push(`${tagPrefix}${item._source.id}`)
            }
          })
        }

        let resultProcessor = factory.getAdapter(entityType, indexName, req, res)

        if (!resultProcessor) { resultProcessor = factory.getAdapter('default', indexName, req, res) } // get the default processor

        if (entityType === 'product') {
          resultProcessor.process(_resBody.hits.hits, groupId).then((result) => {
            _resBody.hits.hits = result
            _cacheStorageHandler(config, _resBody, reqHash, tagsArray)
            res.json(_resBody);
          }).catch((err) => {
            console.error(err)
          })
        } else {
          resultProcessor.process(_resBody.hits.hits).then((result) => {
            _resBody.hits.hits = result
            _cacheStorageHandler(config, _resBody, reqHash, tagsArray)
            res.json(_resBody);
          }).catch((err) => {
            console.error(err)
          })
        }
      } else { // no cache storage if no results from Elastic
        res.json(_resBody);
      }
    });
  }

  if (config.server.useOutputCache && cache) {
    cache.get(
      'api:' + reqHash
    ).then(output => {
      if (output !== null) {
        res.setHeader('X-VS-Cache', 'Hit')
        res.json(output)
        console.log(`cache hit [${req.url}], cached request: ${Date.now() - s}ms`)
      } else {
        res.setHeader('X-VS-Cache', 'Miss')
        console.log(`cache miss [${req.url}], request: ${Date.now() - s}ms`)
        dynamicRequestHandler()
      }
    }).catch(err => console.error(err))
  } else {
    dynamicRequestHandler()
  }
}
