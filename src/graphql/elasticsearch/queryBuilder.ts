import bodybuilder from 'bodybuilder';
import { elasticsearch, ElasticsearchQueryConfig } from 'storefront-query-builder'
import config from 'config'

export function buildQuery ({
  filter = [],
  sort = '',
  currentPage = 1,
  pageSize = 10,
  search = '',
  type = 'product'
}) {
  let queryChain = bodybuilder();
  elasticsearch.buildQueryBodyFromFilterObject({ config: (config as ElasticsearchQueryConfig), queryChain, filter, search })
  queryChain = elasticsearch.applySort({ sort, queryChain });
  queryChain = queryChain.from((currentPage - 1) * pageSize).size(pageSize);

  let builtQuery = queryChain.build()
  if (search !== '') {
    builtQuery['min_score'] = config.get('elasticsearch.min_score')
  }
  return builtQuery;
}
