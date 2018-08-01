import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function searchList(page, filter, sort, from, size, search) {
  let query = buildQuery(page, filter, sort, from, size, search);
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
