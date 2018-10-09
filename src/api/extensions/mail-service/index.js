import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
import NodeMailer from 'nodemailer';

module.exports = ({ config, db }) => {

  let msApi = Router();

  /**
   * POST send an email
   */
  msApi.post('/send-email', (req, res) => {
    console.log('sdfdsfsd')

    // let userData = req.body
    // if(!userData.email) {
    //   apiStatus(res, 'Invalid e-mail provided!', 500)
    //   return
    // }

    let transporter = NodeMailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'kz.akbar@gmail.com',
        pass: 'matahari_1984'
      }
    })
    const mailOptions = {
      from: userData.sourceAddress,
      to: userData.targetAddress,
      subject: userData.subject,
      text: userData.emailText
    }
    transporter.sendMail(mailOptions, (error, info) => {
      if (err) {
        apiStatus(res, error, 500)
        return
      }
      apiStatus(res, 'OK', 200)
      transporter.close()
    })
  })

  return msApi
}
