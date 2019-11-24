import { multiStoreConfig } from '../../../../platform/magento1/util'

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

/**
* Add new action to `magento1-vsbridge-client` and `module` instance
*/
export const newMagentoClientAction = (moduleName = '', endpoint = '', urlPrefix = '/', config, req, query = '') => {
  const client = Magento1Client(multiStoreConfig(config.magento1.api, req))
  client.addMethods(moduleName, (restClient) => {
    var module = {};
    module[endpoint] = function (reqData) {
      let url = urlPrefix + endpoint + query
      const token = req.query.token
      if (token) {
        url += `?token=${token}`
      }
      return restClient[req.method.toLowerCase()](url, reqData, token)
        .then(data => {
          return data.code === 200 ? data.result : false
        });
    }

    return module
  })

  return client
}
