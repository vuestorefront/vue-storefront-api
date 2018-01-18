import { apiStatus } from '../../../lib/util';
import { Router } from 'express';

module.exports = ({ config, db }) => {

	let mcApi = Router();
	

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
