import { buildQuery } from './../../graphql/elasticsearch/queryBuilder';
import { adjustQuery, getClient as getElasticClient, getHits } from './../../lib/elastic'

export const queryProducts = (config) =>
  async ({
    filter,
    sort = '',
    currentPage = 1,
    pageSize = 200,
    search = ''
  }, {
      indexName = '',
      _sourceInclude = null,
      _sourceExclude = null
    }) => {
    const query = buildQuery({ filter, sort, currentPage, pageSize, search, type: 'product' })
    const esQuery = adjustQuery({
      index: indexName,
      body: query,
      _sourceInclude,
      _sourceExclude
    }, 'product', config)

    const esResponse = await getElasticClient(config).search(esQuery)

    return getHits(esResponse)
  }
