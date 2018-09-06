import resource from 'resource-router-middleware';
import { apiStatus } from '../lib/util';
import { merge } from 'lodash';

const Ajv = require('ajv'); // json validator
const kue = require('kue');
const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'order',

	/**
	 * POST create an order with JSON payload compliant with models/order.md
	 */
	create(req, res) {

		const ajv = new Ajv();
		const orderSchema = require('../models/order.schema.json')
		const orderSchemaExtension = require('../models/order.schema.extension.json')
		const validate = ajv.compile(merge(orderSchema, orderSchemaExtension));

		if (!validate(req.body)) { // schema validation of upcoming order
			console.dir(validate.errors);
			apiStatus(res, validate.errors, 500);
			return;
		}				

		for (let product of req.body.products) {
			let key = config.tax.calculateServerSide ? { priceInclTax: product.priceInclTax } : {  price: product.price }
			if (config.tax.alwaysSyncPlatformPricesOver) {
				key.id = product.id
			} else {
				key.sku = product.sku
			}
			// console.log(key)
			
			if (!config.tax.usePlatformTotals) {
				if (!hmac.verify(key, product.sgn, config.objHashSecret)) {
					console.error('Invalid hash for ' + product.sku + ': ' + product.sgn)
					apiStatus(res, "Invalid signature validation of " + product.sku, 200);
					return;
				}
			}
		}

		let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }));
		const job = queue.createJob('order', { title: 'Incoming order received on ' + new Date() + ' / ' + req.ip, ip: req.ip, agent: req.headers['user-agent'], receivedAt: new Date(), order: req.body  }/* parsed using bodyParser.json middleware */).save();
		apiStatus(res, job.id, 200);
	},

});
