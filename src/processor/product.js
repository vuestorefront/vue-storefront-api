import PlatformFactory from '../platform/factory'
const jwa = require('jwa');
const hmac = jwa('HS256');

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
                let sgnSrc = (this._config.tax.calculateServerSide === true) ? (item) => { return Object.assign({ priceInclTax: item.priceInclTax }, config.tax.alwaysSyncPlatformPricesOver ? { id: item.id } : { sku: item.sku })} : (item) => { return Object.assign({ price: item.price }, config.tax.alwaysSyncPlatformPricesOver ? { id: item.id } : { sku: item.sku })  }
                item._source.sgn = hmac.sign(sgnSrc(item._source), this._config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
                                
                if (item._source.configurable_children) {
                    item._source.configurable_children = item._source.configurable_children.map((subItem) => {
                        if (subItem) {
                            subItem.sgn = hmac.sign(sgnSrc(subItem), this._config.objHashSecret); 
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