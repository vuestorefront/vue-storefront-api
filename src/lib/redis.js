import Redis from 'redis'

/**
 * Return Redis Client
 * @param {config} config
 */
export function getClient (config) {
  let redisClient = Redis.createClient(config.redis); // redis client
  redisClient.on('error', (err) => { // workaround for https://github.com/NodeRedis/node_redis/issues/713
    redisClient = Redis.createClient(config.redis); // redis client
  });
  if (config.redis.auth) {
    redisClient.auth(config.redis.auth);
  }
  return redisClient
}
