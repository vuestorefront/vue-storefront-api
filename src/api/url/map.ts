import { Router } from 'express'
import { apiStatus, getCurrentStoreView, getCurrentStoreCode } from '../../lib/util'
import { getClient as getElasticClient } from '../../lib/elastic'
import ProcessorFactory from '../../processor/factory'
import get from 'lodash/get'

const adjustQueryForOldES = ({ config }) => {
  const searchedEntities = get(config, 'urlModule.map.searchedEntities', [])
    .map((entity) => ({ type: { value: entity } }))
  if (parseInt(config.elasticsearch.apiVersion) < 6) {
    return {
      filter: {
        bool: {
          should: searchedEntities
        }
      }
    }
  } else {
    return {}
  }
}

/**
 * Builds ES query based on config
 */
const buildQuery = ({ value, config }) => {
  const searchedFields = get(config, 'urlModule.map.searchedFields', [])
    .map((field) => ({ match_phrase: { [field]: { query: value } } }))

  return {
    query: {
      bool: {
        filter: {
          bool: {
            should: searchedFields,
            ...adjustQueryForOldES({ config })
          }
        }
      }
    },
    size: 1 // we need only one record
  }
}

const buildIndex = ({ indexName, config }) => {
  return parseInt(config.elasticsearch.apiVersion) < 6
    ? indexName
    : get(config, 'urlModule.map.searchedEntities', [])
      .map(entity => `${indexName}_${entity}`)
}

const adjustResultType = ({ result, config, indexName }) => {
  if (parseInt(config.elasticsearch.apiVersion) < 6) return result

  // extract type from index for es 7
  const type = result._index.replace(new RegExp(`^(${indexName}_)|(_[^_]*)$`, 'g'), '')
  result._type = type

  return result
}

/**
 * checks result equality because ES can return record even if searched value is not EXACLY what we want (check `match_phrase` in ES docs)
 */
const checkFieldValueEquality = ({ config, result, value }) => {
  const isEqualValue = get(config, 'urlModule.map.searchedFields', [])
    .find((field) => result._source[field] === value)

  return Boolean(isEqualValue)
}

const map = ({ config }) => {
  const router = Router()
  router.post('/', async (req, res) => {
    const { url, excludeFields, includeFields } = req.body
    if (!url) {
      return apiStatus(res, 'Missing url', 500)
    }

    const indexName = getCurrentStoreView(getCurrentStoreCode(req)).elasticsearch.index
    const esQuery = {
      index: buildIndex({ indexName, config }), // current index name
      _source_includes: includeFields ? includeFields.concat(get(config, 'urlModule.map.includeFields', [])) : [],
      _source_excludes: excludeFields,
      body: buildQuery({ value: url, config })
    }

    try {
      const esResponse = await getElasticClient(config).search(esQuery)
      let result = get(esResponse, 'body.hits.hits[0]', null)

      if (result && checkFieldValueEquality({ config, result, value: req.body.url })) {
        result = adjustResultType({ result, config, indexName })
        if (result._type === 'product') {
          const factory = new ProcessorFactory(config)
          let resultProcessor = factory.getAdapter('product', indexName, req, res)
          if (!resultProcessor) {
            resultProcessor = factory.getAdapter('default', indexName, req, res)
          }

          resultProcessor
            .process(esResponse.body.hits.hits, null)
            .then(pResult => {
              pResult = pResult.map(h => Object.assign(h, { _score: h._score }))
              return res.json(pResult[0])
            }).catch((err) => {
              console.error(err)
              return res.json()
            })
        } else {
          return res.json(result)
        }
      } else {
        return res.json(null)
      }
    } catch (err) {
      console.error(err)
      return apiStatus(res, new Error('ES search error'), 500)
    }
  })

  return router
}

export default map
