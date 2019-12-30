import { Router } from 'express';
import { apiStatus } from '../lib/util';
import { buildMultiEntityUrl } from '../lib/elastic';
import request from 'request';
import get from 'lodash/get';

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

module.exports = ({ config }) => {
  const router = Router()
  router.post('/map/:index', (req, res) => {
    const { url, excludeFields, includeFields } = req.body
    if (!url) {
      return apiStatus(res, 'Missing url', 500);
    }

    const esUrl = buildMultiEntityUrl({
      config,
      includeFields: includeFields ? includeFields.concat(get(config, 'urlModule.map.includeFields', [])) : [],
      excludeFields
    })
    const query = buildQuery({ value: url, config })

    // Only pass auth if configured
    let auth = null;
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
        return apiStatus(res, new Error('ES search error'), 500);
      }
      const responseRecord = _resBody.hits.hits[0]
      if (responseRecord && checkFieldValueEquality({ config, response: responseRecord, value: req.body.url })) {
        return res.json(responseRecord)
      }
      res.json()
    })
  })

  return router
}
