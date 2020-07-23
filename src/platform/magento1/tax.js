import AbstractTaxProxy from '../abstract/tax'
import { calculateProductTax, checkIfTaxWithUserGroupIsActive, getUserGroupIdToUse } from 'vsf-utilities'
import TierHelper from '../../helpers/priceTiers'
import bodybuilder from 'bodybuilder'
import es from '../../lib/elastic'

class TaxProxy extends AbstractTaxProxy {
  constructor (config, entityType, indexName, taxCountry, taxRegion = '', sourcePriceInclTax = null, finalPriceInclTax = null) {
    super(config)
    this._entityType = entityType
    this._indexName = indexName
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    this._userGroupId = this._config.tax.userGroupId
    this._storeConfigTax = this._config.tax

    if (this._config.storeViews && this._config.storeViews.multistore) {
      for (let storeCode in this._config.storeViews) {
        const store = this._config.storeViews[storeCode]

        if (typeof store === 'object') {
          if (store.elasticsearch && store.elasticsearch.index) { // workaround to map stores
            if (store.elasticsearch.index === indexName) {
              taxRegion = store.tax.defaultRegion
              taxCountry = store.tax.defaultCountry
              sourcePriceInclTax = store.tax.sourcePriceIncludesTax || null
              finalPriceInclTax = store.tax.finalPriceIncludesTax || null
              this._storeConfigTax = store.tax
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
    if (sourcePriceInclTax == null) {
      sourcePriceInclTax = this._config.tax.sourcePriceIncludesTax
    }
    if (finalPriceInclTax == null) {
      finalPriceInclTax = this._config.tax.finalPriceIncludesTax
    }
    this._deprecatedPriceFieldsSupport = this._config.tax.deprecatedPriceFieldsSupport
    this._taxCountry = taxCountry
    this._taxRegion = taxRegion
    this._sourcePriceInclTax = sourcePriceInclTax
    this._finalPriceInclTax = finalPriceInclTax
    this.taxFor = this.taxFor.bind(this)
  }

  taxFor (product, groupId) {
    return calculateProductTax({
      product,
      taxClasses: this._taxClasses,
      taxCountry: this._taxCountry,
      taxRegion: this._taxRegion,
      sourcePriceInclTax: this._sourcePriceInclTax,
      deprecatedPriceFieldsSupport: this._deprecatedPriceFieldsSupport,
      finalPriceInclTax: this._finalPriceInclTax,
      userGroupId: groupId,
      isTaxWithUserGroupIsActive: checkIfTaxWithUserGroupIsActive(this._storeConfigTax) && typeof groupId === 'number'
    })
  }

  applyTierPrices (productList, groupId) {
    if (this._config.usePriceTiers) {
      for (let item of productList) {
        TierHelper(item._source, groupId)
      }
    }
  }

  process (productList, groupId = null) {
    const inst = this
    return new Promise((resolve, reject) => {
      inst.applyTierPrices(productList, groupId)

      if (this._config.tax.calculateServerSide) {
        const client = es.getClient(this._config)
        const esQuery = es.adjustQuery({
          index: this._indexName,
          body: bodybuilder()
        }, 'taxrule', this._config)

        client.search(esQuery).then((result) => { // we're always trying to populate cache - when online
          inst._taxClasses = es.getHits(result).map(el => { return el._source })
          for (let item of productList) {
            const isActive = checkIfTaxWithUserGroupIsActive(inst._storeConfigTax)
            if (isActive) {
              groupId = getUserGroupIdToUse(inst._userGroupId, inst._storeConfigTax)
            } else {
              groupId = null
            }

            inst.taxFor(item._source, groupId)
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
