import config from 'config'
import { apiStatus } from '../lib/util'
import cache from '../lib/cache-instance'
import request from 'request'

function invalidateCache (req, res) {
  if (config.server.useOutputCache) {
    if (req.query.tag && req.query.key) { // clear cache pages for specific query tag
      if (req.query.key !== config.server.invalidateCacheKey) {
        console.error('Invalid cache invalidation key')
        apiStatus(res, 'Invalid cache invalidation key', 500)
        return
      }
      console.log(`Clear cache request for [${req.query.tag}]`)
      let tags = []
      if (req.query.tag === '*') {
        tags = config.server.availableCacheTags
      } else {
        tags = req.query.tag.split(',')
      }
      const subPromises = []
      tags.forEach(tag => {
        if (config.server.availableCacheTags.indexOf(tag) >= 0 || config.server.availableCacheTags.find(t => {
          return tag.indexOf(t) === 0
        })) {
          subPromises.push(cache.invalidate(tag).then(() => {
            console.log(`Tags invalidated successfully for [${tag}]`)
          }))
        } else {
          console.error(`Invalid tag name ${tag}`)
        }
      })
      Promise.all(subPromises).then(r => {
        apiStatus(res, `Tags invalidated successfully [${req.query.tag}]`, 200)
      }).catch(error => {
        apiStatus(res, error, 500)
        console.error(error)
      })
      if (config.server.invalidateCacheForwarding) { // forward invalidate request to the next server in the chain
        if (!req.query.forwardedFrom && config.server.invalidateCacheForwardUrl) { // don't forward forwarded requests
          request(config.server.invalidateCacheForwardUrl + req.query.tag + '&forwardedFrom=vs', {}, (err, res, body) => {
            if (err) { console.error(err); }
            try {
              if (body && JSON.parse(body).code !== 200) console.log(body);
            } catch (e) {
              console.error('Invalid Cache Invalidation response format', e)
            }
          });
        }
      }
    } else {
      apiStatus(res, 'Invalid parameters for Clear cache request', 500)
      console.error('Invalid parameters for Clear cache request')
    }
  } else {
    apiStatus(res, 'Cache invalidation is not required, output cache is disabled', 200)
  }
}

export default invalidateCache
