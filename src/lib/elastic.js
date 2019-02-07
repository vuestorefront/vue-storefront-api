const path = require('path')
const _ = require('lodash')
const fs = require('fs');
const jsonFile = require('jsonfile')

function putAlias(db, originalName, aliasName, next) {
  let step2 = () => { 
    db.indices.putAlias({ index: originalName, name: aliasName }).then(result=>{
      console.log('Index alias created', result)
    }).then(next).catch(err => {
      console.log(err.message)
      next()
    })
  }
  return db.indices.deleteAlias({
    index: aliasName,
    name:  originalName
  }).then((result) => {
    console.log('Public index alias deleted', result)
    step2()
  }).catch((err) => {
    console.log('Public index alias does not exists', err.message)
    step2()
  })
}

function search (db, query) {
  return db.search(query)
}

function deleteIndex(db, indexName, next) {
  db.indices.delete({
    "index": indexName
  }).then((res) => {
    console.dir(res, { depth: null, colors: true })
    next()
  }).catch(err => {
    console.error(err)
    next(err)
  })
}
function reIndex(db, fromIndexName, toIndexName, next) {
  db.reindex({
    waitForCompletion: true,
    body: {
      "source": {
        "index": fromIndexName
      },
      "dest": {
        "index": toIndexName
      }
    }
  }).then(res => {
    console.dir(res, { depth: null, colors: true })
    next()
  }).catch(err => {
    console.error(err)
    next(err)
  })
}

function createIndex(db, indexName, next) {
  let indexSchema = loadSchema('index');

  const step2 = () => {

    db.indices.delete({
      "index": indexName
    }).then(res1 => {
      console.dir(res1, { depth: null, colors: true })
      db.indices.create(
      {
        "index": indexName,
        "body": indexSchema
      }).then(res2 => {
        console.dir(res2, { depth: null, colors: true })
        next()
      }).catch(err => {
        console.error(err)
        next(err)
      })
    }).catch(() => {
      db.indices.create(
      {
        "index": indexName,
        "body": indexSchema
      }).then(res2 => {
        console.dir(res2, { depth: null, colors: true })
        next()
      }).catch(err => {
        console.error(err)
        next(err)
      })
    })
  }

  return db.indices.deleteAlias({
    index: '*',
    name:  indexName
  }).then((result) => {
    console.log('Public index alias deleted', result)
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
function loadSchema(entityType) {
  let elasticSchema = jsonFile.readFileSync(path.join(__dirname, '../../config/elastic.schema.' + entityType + '.json'));
  const extensionsPath = path.join(__dirname, '../../config/elastic.schema.' + entityType + '.extension.json');
  if (fs.existsSync(extensionsPath)) {
    let elasticSchemaExtensions = jsonFile.readFileSync(extensionsPath);
    elasticSchema = _.merge(elasticSchema, elasticSchemaExtensions) // user extensions
  }
  return elasticSchema
}

function putMappings(db, indexName, next) {
  let productSchema = loadSchema('product');
  let categorySchema = loadSchema('category');
  let taxruleSchema = loadSchema('taxrule');
  let attributeSchema = loadSchema('attribute');
  let pageSchema = loadSchema('page');
  let blockSchema = loadSchema('block');

  db.indices.putMapping({
    index: indexName,
    type: "product",
    body: productSchema
  }).then(res1 => {
    console.dir(res1, { depth: null, colors: true })

    db.indices.putMapping({
      index: indexName,
      type: "taxrule",
      body: taxruleSchema
    }).then(res2 => {
      console.dir(res2, { depth: null, colors: true })

      db.indices.putMapping({
        index: indexName,
        type: "attribute",
        body: attributeSchema
      }).then(res3 => {
        console.dir(res3, { depth: null, colors: true })
        db.indices.putMapping({
          index: indexName,
          type: "cms_page",
          body: pageSchema
        }).then(res4 => {
          console.dir(res4, { depth: null, colors: true })        
          db.indices.putMapping({
            index: indexName,
            type: "cms_block",
            body: blockSchema
          }).then(res5 => {
            console.dir(res5, { depth: null, colors: true })   
            db.indices.putMapping({
              index: indexName,
              type: "category",
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
  putMappings,
  putAlias,
  createIndex,
  deleteIndex,
  reIndex,
  search
}