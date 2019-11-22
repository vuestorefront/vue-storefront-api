import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'

async function list (search, filter, currentPage, pageSize = 200, sort, context, rootValue, _sourceInclude, _sourceExclude) {
  let query = buildQuery({ search, filter, currentPage, pageSize, sort, type: 'category' });

  const esResponse = await client.search({
    index: getIndexName(context.req.url),
    type: config.elasticsearch.indexTypes[1],
    body: query,
    _source_exclude: _sourceExclude,
    _source_include: _sourceInclude
  });

  let response = {}

  // Process hits
  response.items = []
  esResponse.hits.hits.forEach(hit => {
    let item = hit._source
    item._score = hit._score
    response.items.push(item)
  });

  response.total_count = esResponse.hits.total

  // Process sort
  let sortOptions = []
  for (var sortAttribute in sort) {
    sortOptions.push(
      {
        label: sortAttribute,
        value: sortAttribute
      }
    )
  }

  response.sort_fields = {}
  if (sortOptions.length > 0) {
    response.sort_fields.options = sortOptions
  }

  response.page_info = {
    page_size: pageSize,
    current_page: currentPage
  }
  return response;
}

const resolver = {
  Query: {
    categories: (_, { search, filter, currentPage, pageSize, sort, _sourceInclude }, context, rootValue) =>
      list(search, filter, currentPage, pageSize, sort, context, rootValue, _sourceInclude)
  }
};

export default resolver;
