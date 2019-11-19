import Axios from 'axios'

const qs = require('qs')

export default async (response, config) => {
  let recaptchaErrorMsg = 'Google reCAPTCHA is invalid'
  const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify'

  const secret = config.icmaa.googleRecaptcha.secretKey
  const formData = qs.stringify({ secret, response })

  return Axios.post(recaptchaUrl, formData)
    .catch(e => {
      recaptchaErrorMsg += ': ' + e.message
      return false
    })
    .then(r => r && r.data.success && r.status === 200)
    .then(success => success || recaptchaErrorMsg)
}
