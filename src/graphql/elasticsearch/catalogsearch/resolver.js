import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder'

async function searchList(page, filter, range, sort, search) {
  let query = buildQuery(page, filter, range, sort, search);
  const response = await client.search({
    index: config.elasticsearch.index,
    type: config.elasticsearch.indexTypes.product,
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    searchProducts: (_, { filter, range, sort, search}) => searchList('catealogsearch', filter, range, sort, search)
  }
};

export default resolver;
