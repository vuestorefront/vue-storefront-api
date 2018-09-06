import { apiStatus } from '../lib/util';
import { Router } from 'express';

export default ({ config, db }) => {

	let syncApi = Router();

	/** 
	 * GET get stock item
	 */
	syncApi.get('/order/:order_id', (req, res) => {

		const Redis = require('redis');
		let redisClient = Redis.createClient(config.redis); // redis client
		redisClient.on('error', function (err) { // workaround for https://github.com/NodeRedis/node_redis/issues/713
			redisClient = Redis.createClient(config.redis); // redis client
		});
		
		redisClient.get('order$$id$$' + req.param('order_id'), function (err, reply) {
			const orderMetaData = JSON.parse(reply)
			if (orderMetaData) {
				orderMetaData.order = null // for security reasons we're just clearing out the real order data as it's set by `order_2_magento2.js`
			}
			apiStatus(res, err ? err : orderMetaData,  err ? 500 :200);
		})
	})

	return syncApi
}
