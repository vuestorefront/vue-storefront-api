import { apiStatus } from '../../../lib/util'
import { Router } from 'express'
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
    // Check if email address we're sending to is from the white list from config
    const whiteList = config.extensions.mailService.targetAddressWhitelist
    const email = userData.confirmation ? userData.sourceAddress : userData.targetAddress
    if (!whiteList.includes(email)) {
      apiStatus(res, `Target email address (${email}) is not from the whitelist!`, 500)
      return
    }

    // check if provided email addresses actually exist
    EmailCheck(userData.sourceAddress)
      .then(response => {
        if (response) return EmailCheck(userData.targetAddress)
        else {
          apiStatus(res, 'Source email address is invalid!', 500)
        }
      })
      .then(response => {
        if (response) {
          let transporter = NodeMailer.createTransport({
            host,
            port,
            secure,
            auth: {
              user,
              pass
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
