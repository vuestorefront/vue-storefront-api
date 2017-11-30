import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory'

const Ajv = require('ajv'); // json validator

export default ({ config, db }) => {

	let stockApi = Router();
	
	const _getProxy = () => {
		const platform = config.platform
		const factory = new PlatformFactory(config)
		return factory.getAdapter(platform,'stock')
	};

	/** 
	 * GET get stock item
	 */
	stockApi.get('/check/:sku', (req, res) => {

		const stockProxy = _getProxy()
		
		if (!req.param('sku'))
			return apiStatus(res, 'sku parameter is required', 500);

		stockProxy.check(req.param('sku')).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})

	return stockApi
}
