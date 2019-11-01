import { apiStatus } from '../../../lib/util'
import { Router } from 'express'

import Axios from 'axios'

module.exports = ({ config }) => {
  let api = Router()

  api.get('/feed/:name/:count?', async (req, res) => {
    const { name, count } = req.params
    const { consumerKey, consumerSecret } = config.extensions.icmaaTwitter

    const apiTokenUrl = 'https://api.twitter.com/oauth2/token'

    const accessToken = await Axios.post(apiTokenUrl, null, {
      params: { grant_type: 'client_credentials' },
      auth: { username: consumerKey, password: consumerSecret }
    })
      .then(response => response.data.access_token)
      .catch(() => {
        return apiStatus(res, `Couldn't fetch access-token`, 400)
      })

    const apiUrl = 'https://api.twitter.com/1.1'
    const items = await Axios.get(apiUrl + '/statuses/user_timeline.json', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { screen_name: name, count: count || 5 }
    }).then(response => {
      if (response.data.length > 0) {
        return response.data
      }

      return apiStatus(res, `User not found`, 400)
    })

    return apiStatus(res, { items }, 200)
  })

  return api
}
