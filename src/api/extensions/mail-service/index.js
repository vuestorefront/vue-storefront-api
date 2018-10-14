import { apiStatus } from '../../../lib/util'
import { Router } from 'express'
import config from 'config'
import EmailCheck from 'email-check'
import jwt from 'jwt-simple'
import NodeMailer from 'nodemailer'

module.exports = ({ config }) => {
  const msApi = Router()
  let token

  /**
   * GET send token to authorize email
   */
  msApi.get('/get-token', (req, res) => {
    token = jwt.encode(Date.now(), config.extensions.mailService.secretString)
    apiStatus(res, token, 200)
  })

  /**
   * POST send an email
   */
  msApi.post('/send-email', (req, res) => {
    const userData = req.body
    if (!userData.token || userData.token !== token) {
      apiStatus(res, 'Email is not authorized!', 500)
    }
    if (!userData.sourceAddress) {
      apiStatus(res, 'Source email address is not provided!', 500)
      return
    }
    if (!userData.targetAddress) {
      apiStatus(res, 'Target email address is not provided!', 500)
      return
    }
    if (!userData.confirmation
      && !config.extensions.mailService.targetAddressWhitelist.includes(userData.targetAddress)
    ) {
      apiStatus(res, 'Target email address is not from the whitelist!', 500)
      return
    }

    // check if provided email addresses actually exist
    EmailCheck(userData.sourceAddress)
    .then(response => {
      if (response) return EmailCheck(userData.targetAddress)
      else {
        apiStatus(res, 'Source email address is invalid!', 500)
        return
      }
    })
    .then(response => {
      if (response) {
        let transporter = NodeMailer.createTransport({
          host: config.extensions.mailService.transport.host,
          port: config.extensions.mailService.transport.port,
          secure: config.extensions.mailService.transport.secure,
          auth: {
            user: config.extensions.mailService.transport.user,
            pass: config.extensions.mailService.transport.pass
          }
        })
        const mailOptions = {
          from: userData.sourceAddress,
          to: userData.targetAddress,
          subject: userData.subject,
          text: userData.emailText
        }
        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            apiStatus(res, error, 500)
            return
          }
          apiStatus(res, 'OK', 200)
          transporter.close()
        })
      } else {
        apiStatus(res, 'Target email address is invalid!', 500)
      }
    })
    .catch(() => {
      apiStatus(res, 'Invalid email address is provided!', 500)
    })
  })

  return msApi
}
