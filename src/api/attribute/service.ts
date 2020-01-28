
import request from 'request';
import TagCache from 'redis-tag-cache'
import get from 'lodash/get';
import cache from '../../lib/cache-instance'

interface AttributeListParam {
  [key: string]: number[]
}

function getUri (config, indexName) {
  return `${config.elasticsearch.protocol}://${config.elasticsearch.host}:${config.elasticsearch.port}/${indexName}/attribute/_search`
}

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

function clearAttributeOpitons (attribute, optionsIds: number[]) {
  const stringOptionsIds = optionsIds.map(String)
  return {
    ...attribute,
    options: (attribute.options || []).filter(option => stringOptionsIds.includes(option.value))
  }
}

function list (attributesParam: AttributeListParam, config, indexName) {
  return new Promise(async (resolve, reject) => {
    let attributeCodes = Object.keys(attributesParam)

    const rawCachedAttributeList = await Promise.all(
      attributeCodes.map(attributeCode => getAttributeFromCache(attributeCode, config))
    )

    const cachedAttributeList = rawCachedAttributeList
      .map((cachedAttribute, index) => {
        if (cachedAttribute) {
          const attributeOptionsIds = attributesParam[cachedAttribute.attribute_code]
          attributeCodes.splice(index, 1) // side effect - reduce elements in needed attribute list
          return clearAttributeOpitons(cachedAttribute, attributeOptionsIds)
        }
      })
      .filter(Boolean)

    if (!attributeCodes.length) {
      return cachedAttributeList
    }

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
      await setAttributeInCache(fetchedAttributeList, config)
      resolve(cachedAttributeList.concat(
        fetchedAttributeList.map(fetchedAttribute => {
          const attributeOptionsIds = attributesParam[fetchedAttribute.attribute_code]
          return clearAttributeOpitons(fetchedAttribute, attributeOptionsIds)
        }))
      )
    })
  })
}

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
  options
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
    options
  }
}

module.exports = {
  list,
  transformToMetadata
}
