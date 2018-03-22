export function putAlias(db, originalName, aliasName, next) {
    let step2 = () => { 
        db.putAlias({ index: originalName, name: aliasName }).then(result=>{
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

export function deleteIndex(db, indexName, next) {
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
export function reIndex(db, fromIndexName, toIndexName, next) {
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

export function createIndex(db, indexName, next) {

    const step2 = () => {

        db.indices.delete({
            "index": indexName
            }).then(res1 => {
                console.dir(res1, { depth: null, colors: true })
                db.indices.create(
                    {
                        "index": indexName
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
                        "index": indexName
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

export function putMappings(db, indexName, next) {
    db.indices.putMapping({
        index: indexName,
        type: "product",
        body: {
            properties: {
                sku: { type: "string", "index" : "not_analyzed" },
                size: { type: "integer" },
                size_options: { type: "integer" },
                price: { type: "float" },
                has_options: { type: "boolean" },            
                special_price: { type: "float" },
                color: { type: "integer" },
                color_options: { type: "integer" },
                pattern: { type: "string" },
                id: { type: "long" },
                status: { type: "integer" },
                weight: { type: "integer" },
                visibility: { type: "integer" },
                created_at: { 
                    type: "date",           
                    format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                updated_at: { 
                    type: "date",           
                    format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                special_from_date: {
                    type: "date",           
                    format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                special_to_date: {
                    type: "date",           
                    format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                news_from_date: {
                    type: "date",           
                    format: "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                description: { type: "text" },
                name: { type: "text" },
                configurable_children: {
                    properties: {
                        has_options: { type: "boolean" },
                        price: { type: "float" },
                        sku: { type: "string", "index" : "not_analyzed" }
                    }
                },
                configurable_options: {
                    properties: {
                        attribute_id: { type: "long" },
                        default_label: { type: "text"},
                        label: { type: "text"},
                        frontend_label: { type: "text"},   
                        store_label: { type: "text"},
                        values: {
                            properties: {
                                default_label: { type: "text"},
                                label: { type: "text"},
                                frontend_label: { type: "text"},                           
                                store_label: { type: "text"},
                                value_index:  { type: "string", "index" : "not_analyzed" }                          
                            }
                        }
                    }
                },
                category_ids: { type: "long" },
                eco_collection: { type: "integer" },
                eco_collection_options: { type: "integer" },
                erin_recommends: { type: "integer" },
                tax_class_id: { type: "long" }
            }
        }
        }).then(res1 => {
            console.dir(res1, { depth: null, colors: true })
  
            db.indices.putMapping({
                index: indexName,
                type: "taxrule",
                body: {
                properties: {
                    id: { type: "long" },
                    rates: {
                    properties: {
                        rate: { type: "float" }
                    }
                    }
                }
                }
            }).then(res2 => {
                console.dir(res2, { depth: null, colors: true })
  
                db.indices.putMapping({
                    index: indexName,
                    type: "attribute",
                    body: {
                    properties: {
                        id: { type: "long" },
                        attribute_id: { type: "long" },
  
                        options: {
                        properties: {
                            value:  { type: "string", "index" : "not_analyzed" }                          
                        }
                        }
                    }
                    }
                }).then(res3 => {
                    console.dir(res3, { depth: null, colors: true })
                    next()
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