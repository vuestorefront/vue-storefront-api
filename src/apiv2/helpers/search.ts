import request from 'request';
import prepareElasticsearchQueryBody from './elasticsearchQuery'

const search = (config, entityName, locale = '', query): Promise<any> => {
  let auth = null;
  const indexName = config.get('elasticsearch.indices').find(i => i.includes(locale))

  // Only pass auth if configured
  if (config.elasticsearch.user || config.elasticsearch.password) {
    auth = {
      user: config.elasticsearch.user,
      pass: config.elasticsearch.password
    };
  }
  const q = prepareElasticsearchQueryBody(query)
  console.log(q)

  return new Promise((resolve, reject) => {
    request({
      uri: `${config.elasticsearch.protocol}://${config.elasticsearch.host}:${config.elasticsearch.port}/${indexName}/${entityName}/_search`,
      method: 'GET',
      body: q,
      json: true,
      auth: auth
    }, (err, res, resBody) => {
      resolve({ err, res, resBody })
    })
  })
}

export default search
