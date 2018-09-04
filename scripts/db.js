const CommandRouter = require('command-router')
const cli = CommandRouter()

const config = require('config')
const common = require('../migrations/.common')
const es = require('../src/lib/elastic')

cli.option({
  name: 'indexName',
  alias: 'i',
  default: config.elasticsearch.indices[0],
  type: String
})

cli.command('rebuild',  () => { // TODO: add parallel processing
  console.log('** Hello! I am going to rebuild EXISTINT ES index to fix the schema')
  const originalIndex = cli.options.indexName
  const tempIndex = originalIndex + '_' + Math.round(+new Date()/1000)

  console.log(`** Creating temporary index ${tempIndex}`)
  es.createIndex(common.db, tempIndex, function(err) {
    if (err) {
      console.log(err)
    }

    console.log(`** Putting the mappings on top of ${tempIndex}`)
    es.putMappings(common.db, tempIndex, function(err) {

      console.log(`** We will reindex ${originalIndex} with the current schema`)
      es.reIndex(common.db, originalIndex, tempIndex, function (err) {
        if (err) {
          console.log(err)
        }
        
        console.log('** Removing the original index')
        es.deleteIndex(common.db, originalIndex, function (err) {
          if (err) {
            console.log(err)
          }

          console.log('** Creating alias')
          es.putAlias(common.db, tempIndex, originalIndex, function (err) {
            console.log('Done! Bye!')
            process.exit(0)
          })
        })
      })
    })
  })
})

cli.command('new', () => { // TODO: add parallel processing
  console.log('** Hello! I am going to create NE ES index')
  const indexName = cli.options.indexName
  es.createIndex(common.db, indexName, function (err) {
    if (err) {
      console.log(err)
    }

    console.log('Done! Bye!')
  })
})

cli.on('notfound', (action) => {
  console.error(`I don't know how to: ${action}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.error(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`)
  // application specific logging, throwing an error, or other logic here
})
  
process.on('uncaughtException', function (exception) {
  console.error(exception) // to see your exception details in the console
  // if you are on production, maybe you can send the exception details to your
  // email as well ?
})

cli.parse(process.argv)
