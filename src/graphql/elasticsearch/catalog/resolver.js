import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function list(filter, sort, currentPage, pageSize, search, context, rootValue) {
  let query = buildQuery({
    filter: filter,
    sort: sort,
    currentPage: currentPage,
    pageSize: pageSize,
    search: search,
    includeFields: config.entities.productListWithChildren.includeFields,
    excludeFields: config.entities.productListWithChildren.excludeFields
  });

  const parseURL = context.req.url.replace(/^\/+|\/+$/g, '');
  let urlParts = parseURL.split('/');
  if (urlParts.length < 1) {
      throw new Error('Please provide following parameters: /graphql/<storeId>/');
  }
  const storeId = parseInt(urlParts[0])

  const esResponse = await client.search({
    index: config.elasticsearch.indices[storeId],
    type: config.elasticsearch.indexTypes[0],
    body: query
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

  // Convert aggregations to filters
  // response.filters = prepareFiltersByAggregations(esResponse.aggregations, filter)

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

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue)
  }
};

function prepareFiltersByAggregations(aggregations, filter) {
  console.log('filter', filter);
  let filters = {}
  for (var aggregation in aggregations){
    for (var attrToFilter in filter){
      // console.log('incomeFilter', attrToFilter);
      if (aggregation == 'agg_terms_' + attrToFilter) {
        const aggregationData = aggregations[aggregation]
        if (typeof aggregationData !== 'function') {
          // console.log('aggregation', aggregation);
          // console.log('aggregationData terms', aggregationData);
          let aggFilter = {}
          aggFilter.name = aggregation
        }
      }
      if (aggregation == 'agg_range_' + attrToFilter) {
        const aggregationData = aggregations[aggregation]
        if (typeof aggregationData !== 'function') {
          // console.log('aggregation', aggregation);
          // console.log('aggregationData range', aggregationData);
          let aggFilter = {}
          aggFilter.name = aggregation
        }
      }
    }
  }
  return filters
}

export default resolver;
