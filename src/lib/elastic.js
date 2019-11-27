const path = require('path')
const _ = require('lodash')
const fs = require('fs');
const jsonFile = require('jsonfile')
const es = require('@elastic/elasticsearch')

function _updateQueryStringParameter (uri, key, value) {
  var re = new RegExp('([?&])' + key + '=.*?(&|#|$)', 'i');
  if (uri.match(re)) {
    if (value) {
      return uri.replace(re, '$1' + key + '=' + value + '$2');
    } else {
      return uri.replace(re, '$1' + '$2');
    }
  } else {
    var hash = '';
    if (uri.indexOf('#') !== -1) {
      hash = uri.replace(/.*#/, '#');
      uri = uri.replace(/#.*/, '');
    }
    var separator = uri.indexOf('?') !== -1 ? '&' : '?';
    return uri + separator + key + '=' + value + hash;
  }
}

function adjustIndexName (indexName, entityType, config) {
  if (parseInt(config.elasticsearch.apiVersion) < 6) {
    return indexName
  } else {
    return `${indexName}_${entityType}`
  }
}

function adjustBackendProxyUrl (req, indexName, entityType, config) {
  let url
  if (parseInt(config.elasticsearch.apiVersion) < 6) { // legacy for ES 5
    url = config.elasticsearch.host + ':' + config.elasticsearch.port + (req.query.request ? _updateQueryStringParameter(req.url, 'request', null) : req.url)
  } else {
    const queryString = require('query-string');
    const parsedQuery = queryString.parseUrl(req.url).query
    parsedQuery._source_includes = parsedQuery._source_include
    parsedQuery._source_excludes = parsedQuery._source_exclude
    delete parsedQuery._source_exclude
    delete parsedQuery._source_include
    delete parsedQuery.request
    url = config.elasticsearch.host + ':' + config.elasticsearch.port + '/' + adjustIndexName(indexName, entityType, config) + '/_search?' + queryString.stringify(parsedQuery)
  }
  if (!url.startsWith('http')) {
    url = config.elasticsearch.protocol + '://' + url
  }
  return url
}

function adjustQuery (esQuery, entityType, config) {
  if (parseInt(config.elasticsearch.apiVersion) < 6) {
    esQuery.type = entityType
  }
  esQuery.index = adjustIndexName(esQuery.index, entityType, config)
  return esQuery
}

function getHits (result) {
  if (result.body) { // differences between ES5 andd ES7
    return result.body.hits.hits
  } else {
    return result.hits.hits
  }
}

function getClient (config) {
  const esConfig = { // as we're runing tax calculation and other data, we need a ES indexer
    node: `${config.elasticsearch.protocol}://${config.elasticsearch.host}:${config.elasticsearch.port}`,
    apiVersion: config.elasticsearch.apiVersion,
    requestTimeout: 5000
  }
  if (config.elasticsearch.user) {
    esConfig.auth = config.elasticsearch.user + ':' + config.elasticsearch.password
  }
  return new es.Client(esConfig)
}

function putAlias (db, originalName, aliasName, next) {
  let step2 = () => {
    db.indices.putAlias({ index: originalName, name: aliasName }).then(result => {
      console.log('Index alias created')
    }).then(next).catch(err => {
      console.log(err.message)
      next()
    })
  }
  return db.indices.deleteAlias({
    index: aliasName,
    name: originalName
  }).then((result) => {
    console.log('Public index alias deleted')
    step2()
  }).catch((err) => {
    console.log('Public index alias does not exists', err.message)
    step2()
  })
}

function search (db, query) {
  return db.search(query)
}

function deleteIndex (db, indexName, next) {
  db.indices.delete({
    'index': indexName
  }).then((res) => {
    next()
  }).catch(err => {
    return db.indices.deleteAlias({
      index: '*',
      name: indexName
    }).then((result) => {
      console.log('Public index alias deleted')
      next()
    }).catch((err) => {
      console.log('Public index alias does not exists', err.message)
      next()
    })
  })
}

function reIndex (db, fromIndexName, toIndexName, next) {
  db.reindex({
    wait_for_completion: true,
    waitForCompletion: true,
    body: {
      'source': {
        'index': fromIndexName
      },
      'dest': {
        'index': toIndexName
      }
    }
  }).then(res => {
    next()
  }).catch(err => {
    next(err)
  })
}

function createIndex (db, indexName, collectionName, next) {
  let indexSchema = collectionName ? loadSchema(collectionName) : loadSchema('index', '5.6'); /** index schema is used only for 5.6 */

  const step2 = () => {
    db.indices.delete({
      'index': indexName
    }).then(res1 => {
      db.indices.create(
        {
          'index': indexName,
          'body': indexSchema
        }).then(res2 => {
        next()
      }).catch(err => {
        console.error(err)
        next(err)
      })
    }).catch(() => {
      db.indices.create(
        {
          'index': indexName,
          'body': indexSchema
        }).then(res2 => {
        next()
      }).catch(err => {
        console.error(err)
        next(err)
      })
    })
  }

  return db.indices.deleteAlias({
    index: '*',
    name: indexName
  }).then((result) => {
    console.log('Public index alias deleted')
    step2()
  }).catch((err) => {
    console.log('Public index alias does not exists', err.message)
    step2()
  })
}

/**
 * Load the schema definition for particular entity type
 * @param {String} entityType
 */
function loadSchema (entityType, apiVersion = '7.1') {
  const rootSchemaPath = path.join(__dirname, '../../config/elastic.schema.' + entityType + '.json')
  if (!fs.existsSync(rootSchemaPath)) {
    return null
  }
  let schemaContent = jsonFile.readFileSync(rootSchemaPath)
  let elasticSchema = parseInt(apiVersion) < 6 ? schemaContent : Object.assign({}, { mappings: schemaContent });
  const extensionsPath = path.join(__dirname, '../../config/elastic.schema.' + entityType + '.extension.json');
  if (fs.existsSync(extensionsPath)) {
    schemaContent = jsonFile.readFileSync(extensionsPath)
    let elasticSchemaExtensions = parseInt(apiVersion) < 6 ? schemaContent : Object.assign({}, { mappings: schemaContent });
    elasticSchema = _.merge(elasticSchema, elasticSchemaExtensions) // user extensions
  }
  return elasticSchema
}

// this is deprecated just for ES 5.6
function putMappings (db, indexName, next) {
  let productSchema = loadSchema('product', '5.6');
  let categorySchema = loadSchema('category', '5.6');
  let taxruleSchema = loadSchema('taxrule', '5.6');
  let attributeSchema = loadSchema('attribute', '5.6');
  let pageSchema = loadSchema('cms_page', '5.6');
  let blockSchema = loadSchema('cms_block', '5.6');

  Promise.all([
    db.indices.putMapping({
      index: indexName,
      type: 'product',
      body: productSchema
    }),
    db.indices.putMapping({
      index: indexName,
      type: 'taxrule',
      body: taxruleSchema
    }),
    db.indices.putMapping({
      index: indexName,
      type: 'attribute',
      body: attributeSchema
    }),
    db.indices.putMapping({
      index: indexName,
      type: 'cms_page',
      body: pageSchema
    }),
    db.indices.putMapping({
      index: indexName,
      type: 'cms_block',
      body: blockSchema
    }),
    db.indices.putMapping({
      index: indexName,
      type: 'category',
      body: categorySchema
    })
  ]).then(values => values.forEach(res => console.dir(res.body, { depth: null, colors: true })))
    .then(next)
    .catch(next)
}

module.exports = {
  putAlias,
  createIndex,
  deleteIndex,
  reIndex,
  search,
  adjustQuery,
  adjustBackendProxyUrl,
  getClient,
  getHits,
  adjustIndexName,
  putMappings
}
