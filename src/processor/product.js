import PlatformFactory from '../platform/factory'
const jwa = require('jwa');
const hmac = jwa('HS256');
import { sgnSrc } from '../lib/util'

class ProductProcessor {
  constructor(config, entityType, indexName, req, res){
    this._config = config
    this._entityType = entityType
    this._indexName = indexName
    this._req = req
    this._res = res    
  }

  process (items, groupId = null) {
    console.debug('Entering ProductProcessor::process')

    const processorChain = []

    const platform = this._config.platform
    const factory = new PlatformFactory(this._config)
    const taxCountry = this._config.tax.defaultCountry
    const taxProcessor = factory.getAdapter(platform, 'tax', this._indexName, taxCountry)

    processorChain.push(taxProcessor.process(items, groupId))

    return Promise.all(processorChain).then(((resultSet) => {

      if (!resultSet || resultSet.length === 0) {
        throw Error('error with resultset for processor chaining')
      }

      if (this._req.query._source_exclude && this._req.query._source_exclude.indexOf('sgn') < 0) {
        const rs = resultSet[0].map(((item) => {
          if (!item._source)
            return item

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
        }).bind(this))

        // return first resultSet
        return rs
      } else {
        return resultSet[0]
      }
    }).bind(this))
  }
}

module.exports = ProductProcessor
