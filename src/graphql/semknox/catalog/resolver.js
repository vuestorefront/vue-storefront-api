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
  let esIndex  = config.elasticsearch.indices[0]

  if (urlParts.length >= 1 && urlParts[0] != '') {
    esIndex = config.storeViews[urlParts[0]].elasticsearch.index
  }

  let esResponse = await client.search({
    index: esIndex,
    type: config.elasticsearch.indexTypes[0],
    body: query
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

/*
* Convert Aggregations to the Filters type provided by Magento graphQl EAV schema
*
* @TODO need to check if we can switch to using Filters intsead of Aggregation in the response
* following by Magento Products response type and finihs convertions
*/
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
