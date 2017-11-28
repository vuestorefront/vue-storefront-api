import resource from 'resource-router-middleware';
import { apiStatus } from '../lib/util';
import PlatformFactory from '../platform/factory'

const Ajv = require('ajv'); // json validator

const kue = require('kue');
const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'user',

	/** 
	 * POST create an user
	 */
	create(req, res) {

		const ajv = new Ajv();
		const validate = ajv.compile(require('../models/user.schema.json'));

		if (!validate(req.body)) { // schema validation of upcoming order
			console.dir(validate.errors);
			apiStatus(res, validate.errors, 200);
			return;
		}				

		const platform = config.platform
		const factory = new PlatformFactory(config)
		const userProxy = factory.getAdapter(platform,'user')

		
		userProxy.register(req.body).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	},

	
});
