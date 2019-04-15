import { apiStatus } from '../../../lib/util'
import { Router } from 'express'

module.exports = ({ config, db }) => {

	let mcApi = Router();

  /**
   * Retrieve user status
   */
  mcApi.get('/subscribe', (req, res) => {

    let email = req.query.email
    if(!email) {
      apiStatus(res, 'Invalid e-mail provided!', 500)
      return
    }
    let md5 = require('md5')
    let request = require('request');
    request({
      url: config.extensions.mailchimp.apiUrl + '/lists/' + config.extensions.mailchimp.listId + '/members/' + md5(email.toLowerCase()),
      method: 'GET',
      json: true,
      headers: { 'Authorization': 'apikey ' + config.extensions.mailchimp.apiKey }
    }, function (error, response, body) {
      if (error) {
        apiStatus(res, error, 500)
      } else {
        apiStatus(res, body, 200)
      }
    })
  })

	/** 
	 * POST create an user
	 */
	mcApi.post('/subscribe', (req, res) => {

		let userData = req.body
		if(!userData.email) {
			apiStatus(res, 'Invalid e-mail provided!', 500)
			return
		}
		
		let request = require('request');
		request({
			url: config.extensions.mailchimp.apiUrl + '/lists/' + config.extensions.mailchimp.listId + '/members',
			method: 'POST',
			headers: { 'Authorization': 'apikey ' + config.extensions.mailchimp.apiKey },
			json: true,
			body: { email_address: userData.email, status: 'subscribed' }
		}, function (error, response, body) {
			if (error) {
				apiStatus(res, error, 500)
			} else {
				apiStatus(res, body, 200)
			}
		})
	})

	/** 
	 * DELETE delete an user
	 */
	mcApi.delete('/subscribe', (req, res) => {

		let userData = req.body
		if(!userData.email) {
			apiStatus(res, 'Invalid e-mail provided!', 500)
			return
		}
		
		let request = require('request');
		request({
			url: config.extensions.mailchimp.apiUrl + '/lists/' + config.extensions.mailchimp.listId,
			method: 'POST',
			headers: { 'Authorization': 'apikey ' + config.extensions.mailchimp.apiKey },
			json: true,
			body: { members: [ { email_address: userData.email, status: 'unsubscribed' } ], "update_existing": true }
		}, function (error, response, body) {
			if (error) {
				apiStatus(res, error, 500)
			} else {
				apiStatus(res, body, 200)
			}
		})
	})

  return mcApi
}
