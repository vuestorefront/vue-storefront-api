import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import esResultsProcessor from './processor'
import { getIndexName } from '../mapping'

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize, _sourceInclude, _sourceExclude }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude)
  }
};

async function list (filter, sort, currentPage, pageSize, search, context, rootValue, _source_include, _source_exclude) {
  let _req = {
    query: {
      _source_exclude,
      _source_include
    }
  }

  let query = buildQuery({
    filter: filter,
    sort: sort,
    currentPage: currentPage,
    pageSize: pageSize,
    search: search,
    type: 'product'
  });

  let esIndex = getIndexName(context.req.url)

  let esResponse = await client.search({
    index: esIndex,
    type: config.elasticsearch.indexTypes[0],
    body: query,
    _source_include,
    _source_exclude
  });

  const { body } = esResponse

  if (body && body.hits && body.hits.hits) {
    // process response result (caluclate taxes etc...)
    body.hits.hits = await esResultsProcessor(body, _req, config.elasticsearch.indexTypes[0], esIndex);
  }

  let response = {}

  // Process hits
  response.items = []
  body.hits.hits.forEach(hit => {
    let item = hit._source
    item._score = hit._score
    response.items.push(item)
  });

  response.total_count = body.hits.total

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

  response.aggregations = body.aggregations
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

export default resolver;
