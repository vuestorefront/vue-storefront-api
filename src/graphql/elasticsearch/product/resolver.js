import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import esResultsProcessor from './processor'
import { getIndexName } from '../mapping'
import { getCurrentPlatformConfig } from '../../../platform/helpers'

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize, _sourceInclude, _sourceExclude }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude)
  },
  Products: {
    items: (_, { search }, context, rootValue) => { return _.items } // entry point for product extensions
  },
  Product: {
    categories: (_, { search }, context, rootValue) => {
      return _.category
    },
    /* TODO: We can extend our resolvers to meet the Magento2 GraphQL data model easily
    breadcrumbs: (_, { search }, context, rootValue) => {
      return _.category
    },
    price_range: (_, { search }, context, rootValue) => {
      return {
        minimum_price: {
          regular_price: {},
          final_price: {},
          discount: {}
        },
        maximum_price: {
          regular_price: {},
          final_price: {},
          discount: {}
        }
      }
    }, */
    media_gallery: (_, { search }, context, rootValue) => {
      if (_.media_gallery) {
        return _.media_gallery.map(mItem => {
          return {
            image: mItem.image,
            vid: mItem.vid,
            typ: mItem.typ,
            url: `${getCurrentPlatformConfig().imgUrl}${mItem.image}`,
            label: mItem.lab,
            video: mItem.vid,
            type: mItem.typ
          }
        })
      } else {
        return []
      }
    } // entry point for product extensions
  }
};

async function list (filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude) {
  let _req = {
    query: {
      _source_exclude: _sourceExclude,
      _source_include: _sourceInclude
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
    _sourceInclude,
    _sourceExclude
  });

  if (esResponse && esResponse.hits && esResponse.hits.hits) {
    // process response result (caluclate taxes etc...)
    esResponse.hits.hits = await esResultsProcessor(esResponse, _req, config.elasticsearch.indexTypes[0], esIndex);
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
  for (var sortAttribute in sort) {
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
