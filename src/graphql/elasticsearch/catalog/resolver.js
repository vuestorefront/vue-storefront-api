import config from 'config';
import client from '../client';
import map from 'lodash/map';
import { buildQuery } from '../queryBuilder';

async function list(page, filter, sort, from, size) {
  let query = buildQuery(page, filter, sort, from, size);
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
    products: (_, { filter, sort, from, size }) =>
      list('catalog', filter, sort, from, size)
  }
};

export default resolver;
