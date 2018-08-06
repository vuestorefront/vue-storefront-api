import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilderVSF';

async function list(filter, sort, currentPage, pageSize, search,) {
  let query = buildQuery(filter, sort, currentPage, pageSize, search);

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[0],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize }) =>
      list(filter, sort, currentPage, pageSize, search)
  }
};

export default resolver;
