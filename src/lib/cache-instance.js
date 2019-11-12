const fs = require('fs')
const path = require('path')
const TagCache = require('redis-tag-cache').default
const config = require('config')
let cache = false

if (config.server.useOutputCache) {
  const redisConfig = Object.assign(config.redis)
  cache = new TagCache({
    redis: redisConfig,
    defaultTimeout: config.server.outputCacheDefaultTtl
  })
}

module.exports = cache
