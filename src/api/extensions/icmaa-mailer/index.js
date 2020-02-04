import { Router } from 'express'
import { apiStatus } from '../../../lib/util'

import NodeMailer from 'nodemailer'
import jwt from 'jwt-simple'

import GoogleRecaptcha from '../icmaa/helpers/googleRecaptcha'
import Redis from '../icmaa/helpers/redis'

module.exports = ({ config }) => {
  let api = Router()
  let token

  /**
   * GET send token to authorize email
   */
  api.get('/get-token', (req, res) => {
    token = jwt.encode(Date.now(), config.extensions.mailService.secretString)
    apiStatus(res, token, 200)
  })

  api.post('/send-mail', async (req, res) => {
    const { name, recaptcha, ip } = req.body

    const recaptchaCheck = await GoogleRecaptcha(recaptcha, config)
    if (recaptchaCheck !== true) {
      apiStatus(res, recaptchaCheck, 500)
      return
    }

    if (ip) {
      const redis = Redis(config, 'form-' + name)
      if (await redis.get(ip)) {
        apiStatus(res, 'Your IP has already been used.', 500)
        return
      }
      await redis.set(ip, true, [])
    }

    const userData = req.body
    if (!userData.token || userData.token !== token) {
      apiStatus(res, 'Email is not authorized!', 500)
    }
    const { host, port, secure, user, pass } = config.extensions.mailService.transport
    if (!host || !port || !user || !pass) {
      apiStatus(res, 'No transport is defined for mail service!', 500)
    }
    if (!userData.sourceAddress) {
      apiStatus(res, 'Source email address is not provided!', 500)
      return
    }
    if (!userData.targetAddress) {
      apiStatus(res, 'Target email address is not provided!', 500)
      return
    }

    const whiteList = config.extensions.mailService.targetAddressWhitelist
    const email = userData.confirmation ? userData.sourceAddress : userData.targetAddress
    if (!whiteList.find(e => (email.startsWith(e) || email.endsWith(e)))) {
      apiStatus(res, `Target email address (${email}) is not from the whitelist!`, 500)
      return
    }

    const auth = { user, pass }
    let transporter = NodeMailer.createTransport({ auth, host, port, secure })

    const { text, html, replyTo } = userData
    const mailOptions = {
      from: userData.sourceAddress,
      to: userData.targetAddress,
      subject: userData.subject,
      replyTo,
      text,
      html
    }

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        apiStatus(res, error, 500)
        return
      }

      apiStatus(res, 'OK', 200)

      transporter.close()
    })
  })

  return api
}
