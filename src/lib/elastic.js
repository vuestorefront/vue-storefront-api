const path = require('path')
const _ = require('lodash')
const fs = require('fs');
const jsonFile = require('jsonfile')
const es = require('elasticsearch')

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
    url = config.elasticsearch.host + ':' + config.elasticsearch.port + '/' + `${indexName}_${entityType}` + '/_search?' + queryString.stringify(parsedQuery)
  }
  if (!url.startsWith('http')) {
    url = config.elasticsearch.protocol + '://' + url
  }
  return url
}

function adjustQuery (esQuery, entityType, config) {
  if (parseInt(config.elasticsearch.apiVersion) < 6) {
    esQuery.type = entityType
  } else {
    esQuery.index = `${esQuery.index}_${entityType}`
  }
  return esQuery
}

function getHits (result) {
  if (result.body) { // differences between ES5 andd ES7
    return result.bodyc
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
    console.error(err)
    next(err)
  })
}

function createIndex (db, indexName, collectionName, next) {
  let indexSchema = collectionName ? loadSchema(collectionName) : loadSchema('index');

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
function loadSchema (entityType) {
  const rootSchemaPath = path.join(__dirname, '../../config/elastic.schema.' + entityType + '.json')
  if (!fs.existsSync(rootSchemaPath)) {
    return null
  }
  let elasticSchema = Object.assign({}, { mappings: jsonFile.readFileSync(rootSchemaPath) });
  const extensionsPath = path.join(__dirname, '../../config/elastic.schema.' + entityType + '.extension.json');
  if (fs.existsSync(extensionsPath)) {
    let elasticSchemaExtensions = Object.assign({}, { mappings: jsonFile.readFileSync(extensionsPath) });
    elasticSchema = _.merge(elasticSchema, elasticSchemaExtensions) // user extensions
  }
  return elasticSchema
}

// this is deprecated just for ES 5.6
function putMappings (db, indexName, next) {
  let productSchema = loadSchema('product');
  let categorySchema = loadSchema('category');
  let taxruleSchema = loadSchema('taxrule');
  let attributeSchema = loadSchema('attribute');
  let pageSchema = loadSchema('page');
  let blockSchema = loadSchema('block');

  db.indices.putMapping({
    index: indexName,
    type: 'product',
    body: productSchema
  }).then(res1 => {
    console.dir(res1, { depth: null, colors: true })

    db.indices.putMapping({
      index: indexName,
      type: 'taxrule',
      body: taxruleSchema
    }).then(res2 => {
      console.dir(res2, { depth: null, colors: true })

      db.indices.putMapping({
        index: indexName,
        type: 'attribute',
        body: attributeSchema
      }).then(res3 => {
        console.dir(res3, { depth: null, colors: true })
        db.indices.putMapping({
          index: indexName,
          type: 'cms_page',
          body: pageSchema
        }).then(res4 => {
          console.dir(res4, { depth: null, colors: true })
          db.indices.putMapping({
            index: indexName,
            type: 'cms_block',
            body: blockSchema
          }).then(res5 => {
            console.dir(res5, { depth: null, colors: true })
            db.indices.putMapping({
              index: indexName,
              type: 'category',
              body: categorySchema
            }).then(res6 => {
              console.dir(res6, { depth: null, colors: true })
              next()
            })
          })
        })
      }).catch(err3 => {
        throw new Error(err3)
      })
    }).catch(err2 => {
      throw new Error(err2)
    })
  }).catch(err1 => {
    console.error(err1)
    next(err1)
  })
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
  putMappings
}
