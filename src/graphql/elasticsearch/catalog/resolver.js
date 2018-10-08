import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import esResultsProcessor from './processor'

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize, _sourceInclude, _sourceExclude }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude)
  }
};

async function list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude) {
  let query = buildQuery({
    filter: filter,
    sort: sort,
    currentPage: currentPage,
    pageSize: pageSize,
    search: search,
    type: 'product'
  });

  const parseURL = context.req.url.replace(/^\/+|\/+$/g, '');
  let urlParts = parseURL.split('/');
  let esIndex  = config.elasticsearch.indices[0]

  if (urlParts.length >= 1 && urlParts[0] != '' && urlParts[0] != '?') {
    esIndex = config.storeViews[urlParts[0]].elasticsearch.index
  }

  let esResponse = await client.search({
    index: esIndex,
    type: config.elasticsearch.indexTypes[0],
    body: query,
    _sourceInclude,
    _sourceExclude
  });

  if (esResponse && esResponse.hits && esResponse.hits.hits) {
    // process response result (caluclate taxes etc...)
    esResponse.hits.hits = await esResultsProcessor(esResponse, config.elasticsearch.indexTypes[0], esIndex);
  }

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
  for (var sortAttribute in sort){
    sortOptions.push(
      {
        label: sortAttribute,
        value: sortAttribute
      }
    )
  }

  response.aggregations = esResponse.aggregations
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
