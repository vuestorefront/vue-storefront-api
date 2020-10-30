const Magento2Client = require('magento2-rest-client').Magento2Client;
const config = require('config')
const logger = console;

function getApi (storeCode) {
  let apiConfig = config.magento2.api;
  if (storeCode) {
    if (config.availableStores.indexOf(storeCode) >= 0) {
      apiConfig = Object.assign({}, apiConfig, { url: apiConfig.url + '/' + storeCode });
      logger.debug('> Store code', storeCode);
    } else {
      logger.error('Invalid store code', storeCode)
    }
  }

  return Magento2Client(apiConfig);
}

module.exports = {
  getApi
};
