import config from 'config';
import client from '../client';
import map from 'lodash/map';
import { buildQuery } from '../queryBuilder';

async function searchList(page, filter, sort, from, size, search) {
  let query = buildQuery(page, filter, sort, from, size, search);
  query.from = from;
  query.size = size;
  if (sort) {
    map(sort, function(value, key) {
      query.sort(key, value);
    });
  }

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[0],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    searchProducts: (_, { filter, sort, from, size, search }) =>
      searchList('catalogsearch', filter, sort, from, size, search)
  }
};

export default resolver;
