import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import esResultsProcessor from './processor'

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue)
  }
};

async function list(filter, sort, currentPage, pageSize, search, context, rootValue) {
  let query = buildQuery({
    filter: filter,
    sort: sort,
    currentPage: currentPage,
    pageSize: pageSize,
    search: search,
    includeFields: config.entities.productListWithChildren.includeFields,
    excludeFields: config.entities.productListWithChildren.excludeFields,
    type: 'product'
  });

  const parseURL = context.req.url.replace(/^\/+|\/+$/g, '');
  let urlParts = parseURL.split('/');
  if (urlParts.length < 1) {
      throw new Error('Please provide following parameters: /graphql/<storeId>/');
  }
  const storeId = parseInt(urlParts[0])

  let esResponse = await client.search({
    index: config.elasticsearch.indices[storeId],
    type: config.elasticsearch.indexTypes[0],
    body: query
  });

  if (esResponse && esResponse.hits && esResponse.hits.hits) {
    // process response result (caluclate taxes etc...)
    esResponse.hits.hits = await esResultsProcessor(esResponse, config.elasticsearch.indexTypes[0], config.elasticsearch.indices[storeId]);
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
