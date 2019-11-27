import config from 'config'
import * as redis from './lib/redis'
import * as elastic from './lib/elastic'

export default callback => {
  // connect to a database if needed, then pass it to `callback`:
  const dbContext = {
    getRedisClient: () => redis.getClient(config),
    getElasticClient: () => elastic.getClient(config)
  }
  callback(dbContext);
}
