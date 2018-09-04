const CommandRouter = require('command-router')
const cli = CommandRouter()

const config = require('config')
const common = require('../migrations/.common')
const es = require('../src/lib/elastic')

cli.option({ name: 'indexName',
  alias: 'i',
  default: config.elasticsearch.indices[0],
  type: String
})

cli.option({ name: 'oldFormat',
  alias: 'f',
  default: true,
  type: Boolean
})

cli.option({ name: 'size',
  alias: 's',
  default: 10000,
  type: Number
})

cli.command('redirects',  () => { // TODO: add parallel processing
  console.log('** This command will output url redirects from original Magento2 format to Vue Storefront format')
  console.log('** Please check the nginx map module options on how to use this map format: https://serverfault.com/a/441517')
  console.log('** The urls will be mapped to the new VS Url format. Please make sure You have "products.useMagentoUrlKeys=true" in Your vue-storefront/config/local.json')

  const originalIndex = cli.options.indexName

  es.search(common.db, {
    index: originalIndex,
    type: 'product',
    size: cli.options.size,
    body: {}
  }).then(function (resp) {
    const hits = resp.hits.hits

    for (const hit of hits) {
      const product = hit._source
      if (cli.options.oldFormat) {
        console.log(`/${product.url_key} /p/${decodeURIComponent(product.sku)}/${product.url_key}/${decodeURIComponent(product.sku)};`)
      } else {
        console.log(`/${product.url_key} /${product.url_key}/${decodeURIComponent(product.sku)};`)
      }
    }

    es.search(common.db, {
      index: originalIndex,
      type: 'category',
      size: cli.options.size,
      body: {}
    }).then(function (resp) {
      const hits = resp.hits.hits
      for (const hit of hits) {
        const category = hit._source
        if (cli.options.oldFormat) {
          console.log(`/${category.url_path} /c/${category.url_key};`)
        } else {
          console.log(`/${category.url_path} /${category.url_key};`)
        }
      }
    })
  })
})

cli.on('notfound', (action) => {
  console.error(`I don't know how to: ${action}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
   // application specific logging, throwing an error, or other logic here
})

process.on('uncaughtException', function (exception) {
    console.error(exception) // to see your exception details in the console
    // if you are on production, maybe you can send the exception details to your
    // email as well ?
})

cli.parse(process.argv)
