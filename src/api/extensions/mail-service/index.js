import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
import EmailCheck from 'email-check';
import NodeMailer from 'nodemailer';

module.exports = ({ config }) => {
  let msApi = Router();

  /**
   * POST send an email
   */
  msApi.post('/send-email', (req, res) => {
    let userData = req.body
    if(!userData.sourceAddress) {
      apiStatus(res, 'Source email address is not provided!', 500)
      return
    }
    if(!userData.targetAddress) {
      apiStatus(res, 'Target email address is not provided!', 500)
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
          host: config.extensions.mailService.host,
          port: config.extensions.mailService.port,
          secure: config.extensions.mailService.secure,
          auth: {
            user: config.extensions.mailService.user,
            pass: config.extensions.mailService.pass
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
