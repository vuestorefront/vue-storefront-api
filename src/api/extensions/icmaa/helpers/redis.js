import TagCache from 'redis-tag-cache';

export default (config, keyPrefix = 'default') => {
  const redisConfig = config.redis
  if (redisConfig.auth) {
    redisConfig.password = redisConfig.auth
  }

  return new TagCache({
    defaultTimeout: 86400,
    redis: { keyPrefix, ...redisConfig }
  })
}
