import AbstractTaxProxy from '../abstract/tax'
import { calculateProductTax } from '../../lib/taxcalc'
const es = require('elasticsearch')
const bodybuilder = require('bodybuilder')
import TierHelper from '../../helpers/priceTiers'

class TaxProxy extends AbstractTaxProxy {
  constructor (config, entityType, indexName, taxCountry, taxRegion = '', sourcePriceInclTax = null) {
    super(config)
    this._entityType = entityType
    this._indexName = indexName
    this._sourcePriceInclTax = sourcePriceInclTax

    if (this._config.storeViews && this._config.storeViews.multistore) {
      for (let storeCode in this._config.storeViews){
        let store = this._config.storeViews[storeCode]
        if (typeof store === 'object') {
          if (store.elasticsearch && store.elasticsearch.index) { // workaround to map stores
            if (store.elasticsearch.index === indexName) {
              taxRegion = store.tax.defaultRegion
              taxCountry = store.tax.defaultCountry
              sourcePriceInclTax = store.tax.sourcePriceIncludesTax
              break;
            }
          }
        }
      }
    } else {
      if (!taxRegion) {
        taxRegion = this._config.tax.defaultRegion
      }
      if (!taxCountry) {
        taxCountry = this._config.tax.defaultCountry
      }
    }
    if (sourcePriceInclTax === null) {
      sourcePriceInclTax = this._config.tax.sourcePriceIncludesTax
    }
    this._taxCountry = taxCountry
    this._taxRegion = taxRegion
    this._sourcePriceInclTax = sourcePriceInclTax
    console.log('Taxes will be calculated for', taxCountry, taxRegion, sourcePriceInclTax)
    this.taxFor = this.taxFor.bind(this)
  }

  taxFor (product) {
    return calculateProductTax(product, this._taxClasses, this._taxCountry, this._taxRegion, this._sourcePriceInclTax)
  }

  applyTierPrices (productList, groupId) {
    if (this._config.usePriceTiers) {
      for (let item of productList) {
        TierHelper(item._source, groupId)
      }
    }
  }

  process (productList, groupId = null) {
    let inst = this
    return new Promise ((resolve, reject) => {
      inst.applyTierPrices(productList, groupId)

      if (this._config.tax.calculateServerSide) {
        const esConfig = { // as we're runing tax calculation and other data, we need a ES indexer
          host: {
            host: this._config.elasticsearch.host,
            port: this._config.elasticsearch.port
          },
          log: 'debug',
          apiVersion: '5.5',
          requestTimeout: 5000
        }
        if (this._config.elasticsearch.user) {
          esConfig.httpAuth = this._config.elasticsearch.user + ':' + this._config.elasticsearch.password
        }
        
        let client = new es.Client(esConfig)
        const esQuery = {
          index: this._indexName,
          type: 'taxrule',
          body: bodybuilder()
        }
        client.search(esQuery).then(function (taxClasses) { // we're always trying to populate cache - when online
          inst._taxClasses = taxClasses.hits.hits.map(el => { return el._source })
          for (let item of productList) {
            inst.taxFor(item._source)
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
