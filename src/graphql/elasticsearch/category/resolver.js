import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function list(search, filter, currentPage, pageSize = 200, sort) {
  let includeFields = config.entities.category.includeFields;
  let query = buildQuery({ search, filter, currentPage, pageSize, includeFields, sort, type: 'category' });

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[1],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    categories: (_, { search, filter, currentPage, pageSize, sort }) => list(search, filter, currentPage, pageSize, sort)
  }
};

export default resolver;