import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { newMagentoClientAction } from '../icmaa/helpers'

module.exports = ({ config }) => {
  let api = Router()

  const urlPrefix = 'tracking/'

  api.get('/', async (req, res) => {
    const client = newMagentoClientAction('tracking', 'index', urlPrefix, config, req, '/order_id/' + req.query.orderId)
    client.tracking.index()
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
