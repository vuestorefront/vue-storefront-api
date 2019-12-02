import { Router } from 'express'
import { apiStatus } from '../../../lib/util'

import GoogleRecaptcha from '../icmaa/helpers/googleRecaptcha'
import Redis from '../icmaa/helpers/redis'
import { google } from 'googleapis'

module.exports = ({ config }) => {
  let api = Router()

  api.post('/form', async (req, res) => {
    const { spreadsheetId, form } = req.body

    const recaptcha = await GoogleRecaptcha(form.recaptcha, config)
    if (recaptcha !== true) {
      apiStatus(res, recaptcha, 500)
      return
    } else {
      delete form.recaptcha
    }

    if (form.ip) {
      const redis = Redis(config, 'form-' + spreadsheetId)
      if (await redis.get(form.ip)) {
        apiStatus(res, 'Your IP has already been used.', 500)
        return
      }
      await redis.set(form.ip, true, [])
    }

    const scopes = ['https://www.googleapis.com/auth/spreadsheets']
    const auth = new google.auth.GoogleAuth({ scopes }).fromJSON(config.icmaa.googleServiceAccount)
    const sheetsApi = google.sheets('v4')

    // We can't go on here because we need domain-wide acces to docs
    // @see https://stackoverflow.com/questions/44827662/whitelisting-service-account-for-google-drive-document-access
    // @see https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority

    await sheetsApi.spreadsheets.values
      .append({
        auth,
        spreadsheetId,
        range: 'A1',
        includeValuesInResponse: true,
        valueInputOption: 'raw',
        resource: {
          values: [
            Object.values(form)
          ]
        }
      })
      .then(resp => {
        apiStatus(res, true, 200)
      })
      .catch(err => {
        apiStatus(res, err.message, 500)
      })
  })

  return api
}
