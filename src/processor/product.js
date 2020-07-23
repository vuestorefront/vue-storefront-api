import PlatformFactory from '../platform/factory'
import { sgnSrc } from '../lib/util'
const jwa = require('jwa');
const hmac = jwa('HS256');

function compactItem (item, fieldsToCompact) {
  for (let [key, value] of Object.entries(fieldsToCompact)) {
    if (typeof item[key] !== 'undefined') {
      item[value] = item[key]
      delete item[key]
    }
  }
  return item
}

class ProductProcessor {
  constructor (config, entityType, indexName, req, res) {
    this._config = config
    this._entityType = entityType
    this._indexName = indexName
    this._req = req
    this._res = res
  }

  process (items, groupId = null) {
    const processorChain = []
    const platform = this._config.platform
    const factory = new PlatformFactory(this._config, this._req)
    const taxCountry = this._config.tax.defaultCountry
    const taxProcessor = factory.getAdapter(platform, 'tax', this._indexName, taxCountry)
    const configExtensions = 'extensions' in this._config // check 'extensions' defined in config

    processorChain.push(taxProcessor.process(items, groupId))

    for (const ext of this._config.registeredExtensions) {
      // in each registered extension, check 'resultProcessor' is defined
      if (configExtensions && (ext in this._config.extensions) && ('resultProcessors' in this._config.extensions[ext]) && ('product' in this._config.extensions[ext].resultProcessors)) {
        const extProcessorPath = '../api/extensions/' + ext + '/processors'
        try {
          // attempt to instanitate an adapter class, defined in /src/api/extensions/[ext]/processor/[resultProcessors.product].js
          const extProcessor = factory.getAdapter(extProcessorPath, this._config.extensions[ext].resultProcessors.product, this._indexName)
          // if the adapter instance is successfully created, add it to the processor chain
          processorChain.push(extProcessor.process(items))
        } catch (err) {
          // Additional processor not found or failed
          console.log(err)
        }
      }
    }

    return Promise.all(processorChain).then((resultSet) => {
      if (!resultSet || resultSet.length === 0) {
        throw Error('error with resultset for processor chaining')
      }

      // compact price fields
      if (this._req.query.response_format === 'compact') {
        resultSet[0] = resultSet[0].map((item) => {
          const fieldsToCompress = this._config.products.fieldsToCompress
          const fieldsToCompact = this._config.products.fieldsToCompact
          if (!item._source) { return item }
          if (item._source.configurable_children) {
            item._source.configurable_children = item._source.configurable_children.map((subItem) => {
              if (subItem) {
                fieldsToCompress.forEach(field => {
                  if (item._source[field] === subItem[field]) {
                    delete subItem[field] // remove fields that are non distinct
                  }
                })
              }
              return compactItem(subItem, fieldsToCompact)
            })
          }
          item._source = compactItem(item._source, fieldsToCompact)
          return compactItem(item, fieldsToCompact)
        })
      }

      if (this._req.query._source_exclude && this._req.query._source_exclude.indexOf('sgn') < 0) {
        const rs = resultSet[0].map((item) => {
          if (!item._source) { return item }

          const config = this._config
          let sgnObj = (config.tax.calculateServerSide === true) ? { priceInclTax: item._source.priceInclTax } : { price: item._source.price }
          item._source.sgn = hmac.sign(sgnSrc(sgnObj, item), config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders

          if (item._source.configurable_children) {
            item._source.configurable_children = item._source.configurable_children.map((subItem) => {
              if (subItem) {
                let sgnObj = (config.tax.calculateServerSide === true) ? { priceInclTax: subItem.priceInclTax } : { price: subItem.price }
                subItem.sgn = hmac.sign(sgnSrc(sgnObj, subItem), config.objHashSecret);
              }

              return subItem
            })
          }

          return item
        })

        // return first resultSet
        return rs
      } else {
        return resultSet[0]
      }
    })
  }
}

module.exports = ProductProcessor
