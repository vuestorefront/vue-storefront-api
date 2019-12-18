import config from 'config'
import { getCurrentStoreCode } from '../../lib/util'
/**
 * Adjust the config provided to the current store selected via request params
 * @param Object config configuration
 * @param Express request req
 */
export function multiStoreConfig (apiConfig, req) {
  let confCopy = Object.assign({}, apiConfig)
  let storeCode = getCurrentStoreCode(req)

  if (storeCode && config.availableStores.indexOf(storeCode) >= 0) {
    if (config.magento2['api_' + storeCode]) {
      confCopy = Object.assign({}, config.magento2['api_' + storeCode]) // we're to use the specific api configuration - maybe even separate magento instance
    }
    confCopy.url = confCopy.url + '/' + storeCode
  } else {
    if (storeCode) {
      console.error('Unavailable store code', storeCode)
    }
  }

  return confCopy
}
