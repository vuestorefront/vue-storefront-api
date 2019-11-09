import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { multiStoreConfig } from '../../../platform/magento1/util'

const Magento1Client = require('magento1-vsbridge-client').Magento1Client

module.exports = ({ config }) => {
  let api = Router()

  const userUrl = 'user/'

  api.post('/login', async (req, res) => {
    /**
     * Add new action to `magento1-vsbridge-client` `user` instance
     */
    const client = Magento1Client(multiStoreConfig(config.magento1.api, req))
    client.addMethods('user', (restClient) => {
      var module = {};
      module.facebookLogin = function (userData) {
        const url = userUrl + 'facebookauthorization'
        return restClient.post(url, userData)
          .then(data => {
            return data.code === 200 ? data.result : false
          });
      }

      return module;
    })

    client.user.facebookLogin(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
