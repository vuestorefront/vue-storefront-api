import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { newMagentoClientAction } from '../icmaa/helpers'

module.exports = ({ config }) => {
  let api = Router()

  const urlPrefix = 'user/'

  api.post('/login', async (req, res) => {
    const client = newMagentoClientAction('user', 'facebookauthorization', urlPrefix, config, req)
    client.user.facebookauthorization(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
