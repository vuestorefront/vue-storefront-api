import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { newMagentoClientAction } from '../icmaa/helpers'

module.exports = ({ config }) => {
  let api = Router()

  const urlPrefix = 'giftcert/'

  api.post('/index', async (req, res) => {
    const client = newMagentoClientAction('giftcert', 'index', urlPrefix, config, req)
    client.giftcert.index(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
