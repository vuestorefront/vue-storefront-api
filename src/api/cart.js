import resource from 'resource-router-middleware';
import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory'

const Ajv = require('ajv'); // json validator

const kue = require('kue');
const jwa = require('jwa');
const hmac = jwa('HS256');

export default ({ config, db }) => {

	let cartApi = Router();
	
	const _getProxy = () => {
		const platform = config.platform
		const factory = new PlatformFactory(config)
		return factory.getAdapter(platform,'cart')
	};

	/** 
	 * POST create a cart
	 * req.query.token - user token
	 */
	cartApi.post('/create', (req, res) => {
		const cartProxy = _getProxy()
		cartProxy.create(req.query.token).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})			
	})

	/** 
	 * POST update a cart item
	 *   req.query.token - user token
	 *   body.cartItem: {
	 *	  sku: orderItem.sku, 
	 *	  qty: orderItem.qty, 
	 *	 quoteId: cartKey}
	 */
	cartApi.post('/update', (req, res) => {
		const cartProxy = _getProxy()
		if (!req.body.cartItem)
		{
			apiStatus(res, 'No cartItem element provided within the request body', 500)
		}
		cartProxy.update(req.query.token, req.body.cartItem).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})			
	})	


	/** 
	 * POST update a cart item
	 *   req.query.token - user token
	 *   body.cartItem: {
	 *	  sku: orderItem.sku, 
	 *	  qty: orderItem.qty, 
	 *	 quoteId: cartKey}
	 */
	cartApi.post('/delete', (req, res) => {
		const cartProxy = _getProxy()
		if (!req.body.cartItem)
		{
			apiStatus(res, 'No cartItem element provided within the request body', 500)
		}
		cartProxy.delete(req.query.token, req.body.cartItem).then((result) => {
			apiStatus(res, result, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})			
	})		

	return cartApi
}
