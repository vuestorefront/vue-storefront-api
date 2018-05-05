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
		
		if (!req.params.sku)
			return apiStatus(res, 'sku parameter is required', 500);

		stockProxy.check(req.params.sku).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})

	/** 
	 * GET get stock item - 2nd version with the query url parameter
	 */
	stockApi.get('/check', (req, res) => {

		const stockProxy = _getProxy()
		
		if (!req.query.sku)
			return apiStatus(res, 'sku parameter is required', 500);

		stockProxy.check(req.query.sku).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})	

	return stockApi
}
