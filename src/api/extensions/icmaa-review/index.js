import { Router } from 'express'
import { apiStatus } from '../../../lib/util'
import { newMagentoClientAction } from '../icmaa/helpers'
import GoogleRecaptcha from '../icmaa/helpers/googleRecaptcha'

const Ajv = require('ajv')

module.exports = ({ config }) => {
  let api = Router()

  const urlPrefix = 'review/'

  api.post('/create', async (req, res) => {
    const recaptcha = await GoogleRecaptcha(req.body.review.recaptcha, config)
    if (recaptcha !== true) {
      apiStatus(res, recaptcha, 500)
      return
    }

    const ajv = new Ajv();
    const reviewSchema = require('./review.schema.json')
    const validate = ajv.compile(reviewSchema)

    req.body.review.review_status = config.review.defaultReviewStatus

    if (!validate(req.body)) {
      apiStatus(res, validate.errors, 500)
      return
    }

    const client = newMagentoClientAction('review', 'create', urlPrefix, config, req)
    client.review.create(req.body)
      .then((result) => {
        apiStatus(res, result, 200)
      }).catch(err => {
        apiStatus(res, err, 500)
      })
  })

  return api
}
