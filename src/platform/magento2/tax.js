import AbstractTaxProxy from '../abstract/tax'
import { calculateProductTax } from '../../lib/taxcalc'
const es = require('elasticsearch')
const bodybuilder = require('bodybuilder')

class TaxProxy extends AbstractTaxProxy {
    constructor (config, indexName, taxCountry, taxRegion = ''){
        super(config)
        this._indexName = indexName
        this._taxCountry = taxCountry
        this._taxRegion = taxRegion
        this.taxFor = this.taxFor.bind(this)
    }       

    taxFor (product) {
        return calculateProductTax(product, this._taxClasses, this._taxCountry, this._taxRegion)
    }

    process (productList) {
        let inst = this
        return new Promise ((resolve, reject) => { 
            
            if (this._config.tax.calculateServerSide)
            {            
                let client = new es.Client({ // as we're runing tax calculation and other data, we need a ES indexer
                    host: this._config.esHost,
                    log: 'debug',
                    apiVersion: '5.5',
                    requestTimeout: 5000
                })
                

                const esQuery = {
                    index: this._indexName,
                    type: 'taxrule',
                    body: bodybuilder()
                }        
                client.search(esQuery).then(function (taxClasses) { // we're always trying to populate cache - when online
                    inst._taxClasses = taxClasses.hits.hits.map(el => { return el._source })        

                    for (let item of productList) {
                        inst.taxFor(item._source, taxClasses, inst._config.tax.defaultCountry, inst._config.tax.defaultRegion)
                    }

                    resolve(productList)
                }).catch(err => {
                    reject(err)
                })
            } else {
                resolve(productList)
            }
        })
    }
    
}

module.exports = TaxProxy

