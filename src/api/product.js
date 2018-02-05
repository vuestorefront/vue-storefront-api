import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory'
const jwa = require('jwa');
const hmac = jwa('HS256');

const Ajv = require('ajv'); // json validator

export default ({ config, db }) => {

	let sgnSrc = (config.tax.calculateServerSide === true) ? (item) => { return Object.assign({  priceInclTax: item.price_info.final_price }, config.tax.alwaysSyncPlatformPricesOver ? { id: item.id } : { sku: item.sku }) } : (item) => { return Object.assign({  price: item.extension_attributes.tax_adjustments.final_price }, config.tax.alwaysSyncPlatformPricesOver ? { id: item.id } : { sku: item.sku }) }
	let productApi = Router();
	
	const _getProxy = () => {
		const platform = config.platform
		const factory = new PlatformFactory(config)
		return factory.getAdapter(platform,'product')
	};

	/** 
	 * GET get products info
	 */
	productApi.get('/list', (req, res) => {

		const productProxy = _getProxy()
		
		if (!req.query.skus)
			return apiStatus(res, 'skus parameter is required', 500);

		productProxy.list(req.query.skus.split(',')).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})

	/** 
	 * GET get products info
	 */
	productApi.get('/render-list', (req, res) => {

		const productProxy = _getProxy()
		
		if (!req.query.skus)
			return apiStatus(res, 'skus parameter is required', 500);

		productProxy.renderList(req.query.skus.split(',')).then((result) => {
			result.items = result.items.map((item) => {
				item.sgn = hmac.sign(sgnSrc(item), config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
				return item
			})
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})	

	return productApi
}
