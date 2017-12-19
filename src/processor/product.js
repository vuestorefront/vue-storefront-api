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

//                item._source.sgn = hmac.sign({ sku: item._source.sku, price: item._source.price, priceInclTax: item._source.priceInclTax, special_price: item._source.special_price, special_priceInclTax:  item._source.special_priceInclTax }, this._config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
                let sgnSrc = (this._config.tax.calculateServerSide === true) ? (item) => { return { sku: item.sku, price: item.price, priceInclTax: item.priceInclTax, special_price: item.special_price, special_priceInclTax:  item.special_priceInclTax } } : (item) => { return { sku: item.sku, price: item.price } }
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