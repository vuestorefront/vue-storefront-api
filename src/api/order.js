import resource from 'resource-router-middleware';
import apiStatus from '../lib/util';
const Ajv = require('ajv'); // json validator

const kue = require('kue');

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'order',

	/** 
	 * POST create an order with JSON payload compliant with models/order.md
	 */
	create(req, res) {

		const ajv = new Ajv();
		const validate = ajv.compile(require('../models/order.schema.json'));


		if (!validate(req.body)) {
			apiStatus(res, validate.errors, 403);
			return;
		}				

		// TODO: order must be validated - we can use https://www.npmjs.com/package/json-validation
		let queue = kue.createQueue();
		queue.createJob('order', req.body /*using bodyParser.json*/).save();
		apiStatus(res, "Order acknowledged!", 200);
	},

	
});
