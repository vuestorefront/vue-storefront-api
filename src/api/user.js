import resource from 'resource-router-middleware';
import {apiStatus} from '../lib/util';
import {Router} from 'express';
import PlatformFactory from '../platform/factory'
import jwt from 'jwt-simple'

const Ajv = require('ajv'); // json validator

const kue = require('kue');
const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({config, db}) => {

	let userApi = Router();

	const _getProxy = (req) => {
		const platform = config.platform
		const factory = new PlatformFactory(config, req)
		return factory.getAdapter(platform, 'user')
	};

	/**
	 * POST create an user
	 */
	userApi.post('/create', (req, res) => {

		const ajv = new Ajv();
		const validate = ajv.compile(require('../models/userRegister.schema.json'));

		if (!validate(req.body)) { // schema validation of upcoming order
			console.dir(validate.errors);
			apiStatus(res, validate.errors, 200);
			return;
		}

		const userProxy = _getProxy(req)

		userProxy.register(req.body).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	})

	/**
	 * POST login an user
	 */
	userApi.post('/login', (req, res) => {
		const userProxy = _getProxy(req)
		userProxy.login(req.body).then((result) => {
			/**
			 * Second request for more user info
			 */
			if (config.priceTiers) {
				userProxy.me(result).then((resultMe) => {
					/**
					 * Add group id to token
					 */
					if (resultMe.group_id) {
						req.body.group_id = resultMe.group_id
					}
					apiStatus(res, result, 200, {refreshToken: jwt.encode(req.body, config.authHashSecret ? config.authHashSecret : config.objHashSecret)});
				}).catch(err => {
					apiStatus(res, err, 500);
				})
			}

		}).catch(err => {
			apiStatus(res, err, 500);
		})
	});

	/**
	 * POST refresh user token
	 */
	userApi.post('/refresh', (req, res) => {
		const userProxy = _getProxy(req)

		if (!req.body || !req.body.refreshToken) {
			return apiStatus(res, 'No refresh token provided', 500);
		}

		const decodedToken = jwt.decode(req.body ? req.body.refreshToken : '', config.authHashSecret ? config.authHashSecret : config.objHashSecret)
		if (!decodedToken) {
			return apiStatus(res, 'Invalid refresh token provided', 500);
		}
		userProxy.login(decodedToken).then((result) => {
			apiStatus(res, result, 200, {refreshToken: jwt.encode(decodedToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret)});
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	});

	/**
	 * POST resetPassword
	 */
	userApi.post('/resetPassword', (req, res) => {
		const userProxy = _getProxy(req)

		if (!req.body.email) {
			return apiStatus(res, "Invalid e-mail provided!", 500)
		}

		userProxy.resetPassword({email: req.body.email, template: "email_reset", websiteId: 1}).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	});


	/**
	 * GET  an user
	 */
	userApi.get('/me', (req, res) => {
		const userProxy = _getProxy(req)
		userProxy.me(req.query.token).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	});


	/**
	 * GET  an user order history
	 */
	userApi.get('/order-history', (req, res) => {
		const userProxy = _getProxy(req)
		userProxy.orderHistory(req.query.token).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	});

	/**
	 * POST for updating user
	 */
	userApi.post('/me', (req, res) => {
		const ajv = new Ajv();
		const validate = ajv.compile(require('../models/userProfile.schema.json'));

		if (!validate(req.body)) {
			console.dir(validate.errors);
			apiStatus(res, validate.errors, 500);
			return;
		}

		const userProxy = _getProxy(req)
		userProxy.update({token: req.query.token, body: req.body}).then((result) => {
			apiStatus(res, result, 200)
		}).catch(err => {
			apiStatus(res, err, 500)
		})
	})

	/**
	 * POST for changing user's password
	 */
	userApi.post('/changePassword', (req, res) => {
		const userProxy = _getProxy(req)
		userProxy.changePassword({token: req.query.token, body: req.body}).then((result) => {
			apiStatus(res, result, 200)
		}).catch(err => {
			apiStatus(res, err, 500)
		})
	})

	return userApi
}
