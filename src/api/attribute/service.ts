
import request from 'request';
import TagCache from 'redis-tag-cache'
import get from 'lodash/get';
import cache from '../../lib/cache-instance'

export interface AttributeListParam {
  [key: string]: number[]
}

/**
 * Build ES uri fro attributes
 */
function getUri (config, indexName: string): string {
  return `${config.elasticsearch.protocol}://${config.elasticsearch.host}:${config.elasticsearch.port}/${indexName}/attribute/_search`
}

/**
 * Returns attributes from cache
 */
async function getAttributeFromCache (attributeCode: string, config) {
  if (config.server.useOutputCache && cache) {
    try {
      const res = await (cache as TagCache).get(
        'api:attribute-list' + attributeCode
      )
      return res
    } catch (err) {
      console.error(err)
      return null
    }
  }
}

/**
 * Save attributes in cache
 */
async function setAttributeInCache (attributeList, config) {
  if (config.server.useOutputCache && cache) {
    try {
      await Promise.all(
        attributeList.map(attribute => (cache as TagCache).set(
          'api:attribute-list' + attribute.attribute_code,
          attribute
        ))
      )
    } catch (err) {
      console.error(err)
    }
  }
}

/**
 * Returns attribute with only needed options
 * @param attribute - attribute object
 * @param optionsIds - list of only needed options ids
 */
function clearAttributeOpitons (attribute, optionsIds: number[]) {
  const stringOptionsIds = optionsIds.map(String)
  return {
    ...attribute,
    options: (attribute.options || []).filter(option => stringOptionsIds.includes(String(option.value)))
  }
}

function list (attributesParam: AttributeListParam, config, indexName: string): Promise<any[]> {
  return new Promise(async (resolve, reject) => {
    // we start with all attributeCodes that are requested
    let attributeCodes = Object.keys(attributesParam)

    // here we check if some of attribute are in cache
    const rawCachedAttributeList = await Promise.all(
      attributeCodes.map(attributeCode => getAttributeFromCache(attributeCode, config))
    )

    const cachedAttributeList = rawCachedAttributeList
      .filter(Boolean) // remove empty results from cache.get
      .map((cachedAttribute, index) => {
        if (cachedAttribute) {
          const attributeOptionsIds = attributesParam[cachedAttribute.attribute_code]

          // side effect - we want to reduce starting 'attributeCodes' because some of them are in cache
          attributeCodes.splice(index, 1)

          // clear unused options
          return clearAttributeOpitons(cachedAttribute, attributeOptionsIds)
        }
      })

    // if all requested attributes are in cache then we can return here
    if (!attributeCodes.length) {
      return resolve(cachedAttributeList)
    }

    // fetch attributes for rest attributeCodes
    request({
      uri: getUri(config, indexName),
      method: 'POST',
      body: {'query': {'bool': {'filter': {'bool': {'must': [{'terms': {'attribute_code': attributeCodes}}]}}}}},
      json: true
    }, async (err, res, body) => {
      if (err) {
        reject(err)
      }
      const fetchedAttributeList = get(body, 'hits.hits', []).map(hit => hit._source)

      // save atrributes in cache
      await setAttributeInCache(fetchedAttributeList, config)

      // cached and fetched attributes
      const allAttributes = [
        ...cachedAttributeList,
        ...fetchedAttributeList.map(fetchedAttribute => {
          const attributeOptionsIds = attributesParam[fetchedAttribute.attribute_code]

          // clear unused options
          return clearAttributeOpitons(fetchedAttribute, attributeOptionsIds)
        })
      ]

      return resolve(allAttributes)
    })
  })
}

/**
 * Returns only needed data for filters in vsf
 */
function transformToMetadata ({
  is_visible_on_front,
  is_visible,
  default_frontend_label,
  attribute_id,
  entity_type_id,
  id,
  is_user_defined,
  is_comparable,
  attribute_code,
  slug,
  options = [],
  buckets = []
}) {
  return {
    is_visible_on_front,
    is_visible,
    default_frontend_label,
    attribute_id,
    entity_type_id,
    id,
    is_user_defined,
    is_comparable,
    attribute_code,
    slug,
    options,
    buckets
  }
}

export default {
  list,
  transformToMetadata
}
