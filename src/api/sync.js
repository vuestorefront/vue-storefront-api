import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory'

const Ajv = require('ajv'); // json validator

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
			apiStatus(res, err ? err : JSON.parse(reply),  err ? 500 :200);
		})
	})

	return syncApi
}
