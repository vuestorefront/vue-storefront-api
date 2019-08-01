import { apiStatus } from '../../../lib/util'
import { Router } from 'express'

import prismicConnector from './connector/prismic'
import storyblokConnector from './connector/storyblok'
import elasticsearch from 'elasticsearch';

module.exports = ({ config, db }) => {

  function esClient () {
    let { host, port, protocol } = config.elasticsearch
    return new elasticsearch.Client({ host: { host, port, protocol } })
  }

	let api = Router()

  api.get('/by-uid', async (req, res) => {
    if (req.query.type === undefined || req.query.uid === undefined) {
      return apiStatus(res, '"uid" and "type" are mandatory in request url', 500)
    }

    let serviceName = config.extensions.icmaaCms.service;
    switch (serviceName) {
      case 'prismic':
        await prismicConnector.fetch(req.query.type, req.query.uid, req.query.lang)
          .then(response => apiStatus(res, response, 200))
          .catch(error => apiStatus(res, error.message, 500))
          break
      case 'storyblok':
        await storyblokConnector.fetch(req.query.type, req.query.uid, req.query.lang)
          .then(response => apiStatus(res, response, 200))
          .catch(error => apiStatus(res, error.message, 500))
          break
      default:
        return apiStatus(res, `CMS service "${serviceName}" is not supported yet`, 500)
    }
  })

  api.get('/attribute/:code', async (req, res) => {
    return esClient().search({
      index: config.elasticsearch.indices[0],
      type: 'attribute',
      body: {
        "_source": ["attribute_code", "id", "options", "frontend_label"],
        "query": {
          "term": {
            "attribute_code": {
              "value": req.params.code
            }
          }
        }
      }
    }).then(response => {
      if (response.hits.total === 0) {
        return apiStatus(res, 'No attribute found', 400)
      }

      const result = response.hits.hits[0]._source
      if (result && result.options) {
        return apiStatus(res, result.options, 200)
      }

      return apiStatus(res, 'No attribute values found', 400)
      
    })
  })

  return api
}
