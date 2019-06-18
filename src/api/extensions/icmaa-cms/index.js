import { apiStatus } from '../../../lib/util'
import { Router } from 'express'

import prismicConnector from './connector/prismic'

module.exports = ({ config, db }) => {

	let api = Router()

  api.get('/by-uid', async (req, res) => {
    if (req.query.type === undefined || req.query.uid === undefined) {
      return apiStatus(res, '"uid" and "type" are mandatory in request url', 500)
    }

    let serviceName = config.extensions.icmaaCms.service;
    switch (serviceName) {
      case 'prismic':
        await prismicConnector.fetch(req.query.type, req.query.uid, req.query.lang)
          .then(response => apiStatus(res, response, 200))
          .catch(error => apiStatus(res, error.message, 500))
          break
      default:
        return apiStatus(res, `CMS service "${serviceName}" is not supported yet`, 500)
    }
  })

  return api
}
