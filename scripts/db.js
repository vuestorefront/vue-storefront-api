'use harmony'

import CommandRouter from 'command-router'
const cli = CommandRouter()
import config from 'config'
import common from '../migrations/.common'
import { reIndex, deleteIndex, createIndex, putMappings, putAlias } from '../src/lib/elastic';

cli.option({ name: 'indexName',
 alias: 'i',
 default: config.esIndexes[0],
 type: String
})

cli.command('rebuild',  () => { // TODO: add parallel processing
    console.log('** Hello! I am going to rebuild EXISTINT ES index to fix the schema')
    const originalIndex = cli.options.indexName
    const tempIndex = originalIndex + '_' + Math.round(+new Date()/1000)

    console.log('** We will reindex ' + originalIndex + ' with the current schema')
    reIndex(common.db, originalIndex, tempIndex, function (err) {
        if (err) {
            console.log(err)
        }
        
        console.log('** Removing the original index')
        deleteIndex(common.db, originalIndex, function (err) {
            if (err) {
                console.log(err)
            }

            console.log('** Creating alias')
            putAlias(common.db, tempIndex, originalIndex, 


            console.log('** Creating new index')
            createIndex(common.db, originalIndex, function (err) {
                if (err) {
                    console.log(err)
                }

                console.log('** Mappings')
                putMappings(common.db, originalIndex, function (err) {

                    console.log('** Reindexing data back to new index')
                    reIndex(common.db, tempIndex, originalIndex, function (err) {
                        //deleteIndex(common.db, tempIndex, function () {
                        //    console.log('Done! Bye!')
                        // })
                    })
                })
            })

        })
    })
})  


cli.on('notfound', (action) => {
  console.error('I don\'t know how to: ' + action)
  process.exit(1)
})
    
    
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
   // application specific logging, throwing an error, or other logic here
});
  
process.on('uncaughtException', function (exception) {
    console.error(exception); // to see your exception details in the console
    // if you are on production, maybe you can send the exception details to your
    // email as well ?
});

cli.parse(process.argv);
