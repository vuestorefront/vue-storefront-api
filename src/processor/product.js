import PlatformFactory from '../platform/factory'
const jwa = require('jwa');
const hmac = jwa('HS256');
import { sgnSrc } from '../lib/util'

class ProductProcessor {
    constructor(config, entityType, indexName){
        this._config = config
        this._entityType = entityType
        this._indexName = indexName
    }

    process (items) {
        console.debug('Entering ProductProcessor::process')

        const processorChain = []

        const platform = this._config.platform
		const factory = new PlatformFactory(this._config)
		const taxProcessor = factory.getAdapter(platform, 'tax', this._indexName)
        
        processorChain.push(taxProcessor.process(items))

        return Promise.all(processorChain).then(((resultSet) => {

            if (!resultSet || resultSet.length === 0)
            {
                throw Error('error with resultset for processor chaining')
            }

            const rs = resultSet[0].map(((item) => {

                if (!item._source)
                    return item

                const config = this._config
                let sgnObj = (this._config.tax.calculateServerSide === true) ? { priceInclTax: item._source.priceInclTax } : { price: item._source.price } 
                item._source.sgn = hmac.sign(sgnSrc(sgnObj, item), this._config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
                                
                if (item._source.configurable_children) {
                    item._source.configurable_children = item._source.configurable_children.map((subItem) => {
                        if (subItem) {
                            let sgnObj = (this._config.tax.calculateServerSide === true) ? { priceInclTax: subItem.priceInclTax } : { price: subItem.price } 
                            subItem.sgn = hmac.sign(sgnSrc(sgnObj, subItem), this._config.objHashSecret); 
                        }

                        return subItem
                    })
                  }
                
                return item                
            }).bind(this))

             // return first resultSet
             return rs
        }).bind(this))
    }
}

module.exports = ProductProcessor