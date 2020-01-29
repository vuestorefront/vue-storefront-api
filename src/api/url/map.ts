import { Router } from 'express'
import { apiStatus } from '../../lib/util'
import { buildMultiEntityUrl } from '../../lib/elastic'
import ProcessorFactory from '../../processor/factory'
import request from 'request'
import get from 'lodash/get'

/**
 * Builds ES query based on config
 */
const buildQuery = ({ value, config }) => {
  const searchedFields = get(config, 'urlModule.map.searchedFields', [])
    .map((field) => ({ match_phrase: { [field]: { query: value } } }))
  const searchedEntities = get(config, 'urlModule.map.searchedEntities', [])
    .map((entity) => ({ type: { value: entity } }))

  return {
    query: {
      bool: {
        filter: {
          bool: {
            should: searchedFields,
            filter: {
              bool: {
                should: searchedEntities
              }
            }
          }
        }
      }
    },
    size: 1 // we need only one record
  }
}

/**
 * checks result equality because ES can return record even if searched value is not EXACLY what we want (check `match_phrase` in ES docs)
 */
const checkFieldValueEquality = ({ config, response, value }) => {
  const isEqualValue = get(config, 'urlModule.map.searchedFields', [])
    .find((field) => response._source[field] === value)

  return Boolean(isEqualValue)
}

const map = ({ config }) => {
  const router = Router()
  router.post('/:index', (req, res) => {
    const { url, excludeFields, includeFields } = req.body
    if (!url) {
      return apiStatus(res, 'Missing url', 500)
    }

    const esUrl = buildMultiEntityUrl({
      config,
      includeFields: includeFields ? includeFields.concat(get(config, 'urlModule.map.includeFields', [])) : [],
      excludeFields
    })
    const query = buildQuery({ value: url, config })

    // Only pass auth if configured
    let auth = null
    if (config.elasticsearch.user || config.elasticsearch.password) {
      auth = {
        user: config.elasticsearch.user,
        pass: config.elasticsearch.password
      }
    }

    // make simple ES search
    request({
      uri: esUrl,
      method: 'POST',
      body: query,
      json: true,
      auth: auth
    }, (_err, _res, _resBody) => {
      if (_err) {
        console.log(_err)
        return apiStatus(res, new Error('ES search error'), 500)
      }
      const responseRecord = _resBody.hits.hits[0]
      if (responseRecord && checkFieldValueEquality({ config, response: responseRecord, value: req.body.url })) {
        if (responseRecord._type === 'product') {
          const urlSegments = req.url.split('/')
          const indexName = urlSegments[1]

          const factory = new ProcessorFactory(config)
          let resultProcessor = factory.getAdapter('product', indexName, req, res)
          if (!resultProcessor) {
            resultProcessor = factory.getAdapter('default', indexName, req, res)
          }

          resultProcessor
            .process(_resBody.hits.hits, null)
            .then(result => {
              result = result.map(h => Object.assign(h, { _score: h._score }))
              return res.json(result[0])
            }).catch((err) => {
              console.error(err)
              return res.json()
            })
        } else {
          return res.json(responseRecord)
        }
      }
    })
  })

  return router
}

export default map
