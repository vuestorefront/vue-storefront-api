import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function list(search, filter, currentPage, pageSize = 200, sort, _sourceInclude) {
  let query = buildQuery({ search, filter, currentPage, pageSize, sort, type: 'review' });

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[5],
    body: query,
    _sourceInclude
  });

  return response;
}

const resolver = {
  Query: {
    reviews: (_, { search, filter, currentPage, pageSize, sort, _sourceInclude }) =>
      list(search, filter, currentPage, pageSize, sort, _sourceInclude)
  }
};

export default resolver;