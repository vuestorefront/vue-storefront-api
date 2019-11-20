import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { newMagentoClientAction } from '../icmaa/helpers'

module.exports = ({ config }) => {
  let api = Router()

  const urlPrefix = 'newsletter/'

  const subscribeAction = async (req, res) => {
    const client = newMagentoClientAction('newsletter', 'subscribe', urlPrefix, config, req)
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
