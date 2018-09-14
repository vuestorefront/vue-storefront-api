const program = require('commander')
const config = require('config')
const common = require('../migrations/.common')
const es = require('../src/lib/elastic')

program
  .command('redirects')
  .option('-i|--indexName <indexName>', 'name of the Elasticsearch index', config.elasticsearch.indices[0])
  .option('-s|--size <indexName>', 'size', 10000)
  .option('-f|--oldFormat <oldFormat>', 'use old Magento format', true)
  .action((cmd) => { // TODO: add parallel processing
    if (!cmd.indexName) {
      console.log('indexName must be specified');
      process.exit(1);
    }

    console.log('** This command will output url redirects from original Magento2 format to Vue Storefront format')
    console.log('** Please check the nginx map module options on how to use this map format: https://serverfault.com/a/441517')
    console.log('** The urls will be mapped to the new VS Url format. Please make sure You have "products.useMagentoUrlKeys=true" in Your vue-storefront/config/local.json')

    const originalIndex = cmd.indexName

    es.search(common.db, {
      index: originalIndex,
      type: 'product',
      size: cmd.size,
      body: {}
    }).then(function (resp) {
      const hits = resp.hits.hits

      for (const hit of hits) {
        const product = hit._source
        if (cmd.oldFormat) {
          console.log(`/${product.url_key} /p/${decodeURIComponent(product.sku)}/${product.url_key}/${decodeURIComponent(product.sku)};`)
        } else {
          console.log(`/${product.url_key} /${product.url_key}/${decodeURIComponent(product.sku)};`)
        }
      }

      es.search(common.db, {
        index: originalIndex,
        type: 'category',
        size: cmd.size,
        body: {}
      }).then(function (resp) {
        const hits = resp.hits.hits
        for (const hit of hits) {
          const category = hit._source
          if (cmd.oldFormat) {
            console.log(`/${category.url_path} /c/${category.url_key};`)
          } else {
            console.log(`/${category.url_path} /${category.url_key};`)
          }
        }
      })
    })
  })

program
  .on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
   // application specific logging, throwing an error, or other logic here
})

process.on('uncaughtException', function (exception) {
    console.error(exception) // to see your exception details in the console
    // if you are on production, maybe you can send the exception details to your
    // email as well ?
})
