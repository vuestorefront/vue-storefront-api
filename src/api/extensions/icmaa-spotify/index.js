import { apiStatus } from '../../../lib/util'
import { Router } from 'express'

import Axios from 'axios'

module.exports = ({ config }) => {

	let api = Router()

  api.get('/related-bands/:name', async (req, res) => {
    const { name } = req.params

    /**
     * Use the Client Credential flow
     * @see https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-flows
     */
    const apiTokenUrl = 'https://accounts.spotify.com/api/token'
    const username = config.extensions.icmaaSpotify.clientId
    const password = config.extensions.icmaaSpotify.secretId

    const accessToken = await Axios.post(apiTokenUrl, null, {
      params: { grant_type: 'client_credentials' },
      auth: { username, password }
    })
    .then(response => response.data.access_token)
    .catch(() => {
      return apiStatus(res, `Couldn't fetch access-token`, 400)
    })

    const apiUrl = 'https://api.spotify.com/v1'
    const artistId = await Axios.get(apiUrl + '/search', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { q: name, type: 'artist' }
    }).then(response => {
      if (response.data.artists.items.length > 0) {
        return response.data.artists.items[0].id
      }

      return apiStatus(res, `Artist not found`, 400)
    })

    const relatedArtists = await Axios.get(apiUrl + `/artists/${artistId}/related-artists`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(resp => {
      if (resp.data.artists.length > 0) {
        return resp.data.artists
          .sort((a, b) => a.popularity > b.popularity ? -1 : 1)
          .map(artist => artist.name)
      }

      return apiStatus(res, `No related artists not found`, 400)
    })

    return apiStatus(res, relatedArtists, 200)
  })

  return api
}
