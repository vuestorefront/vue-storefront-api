import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { multiStoreConfig } from '../../../platform/magento1/util'

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

module.exports = ({ config }) => {
  let api = Router()

  const urlPrefix = 'newsletter/'

  /**
   * Add new action to `magento1-vsbridge-client` and `newsletter` instance
   */
  const addNewMagentoClientAction = (endpointKey = '', req) => {
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req))
    client.addMethods('newsletter', (restClient) => {
      var module = {};
      module[endpointKey] = function (reqData) {
        const url = urlPrefix + endpointKey
        return restClient[req.method.toLowerCase()](url, reqData)
          .then(data => {
            return data.code === 200 ? data.result : false
          });
      }

      return module
    })

    return client
  }

  const subscribeAction = async (req, res) => {
    const client = addNewMagentoClientAction('subscribe', req)
    client.newsletter.subscribe(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  }

  api.post('/subscribe', subscribeAction)
  api.delete('/subscribe', subscribeAction)

  return api
}
