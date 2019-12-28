const TagCache = require('redis-tag-cache').default
const config = require('config')

if (config.server.useOutputCache) {
  const redisConfig = Object.assign(config.redis)
  module.exports = new TagCache({
    redis: redisConfig,
    defaultTimeout: config.server.outputCacheDefaultTtl
  })
}
