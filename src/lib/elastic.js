const path = require('path')
const _ = require('lodash')
const fs = require('fs');
const jsonFile = require('jsonfile')

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
  let indexSchema = loadSchema(collectionName);

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

module.exports = {
  putAlias,
  createIndex,
  deleteIndex,
  reIndex,
  search
}
