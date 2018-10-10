import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'

async function list(search, filter, currentPage, pageSize = 200, sort, context, rootValue, _sourceInclude) {
  let query = buildQuery({ search, filter, currentPage, pageSize, sort, type: 'review' });

  const response = await client.search({
    index: getIndexName(context.req.url),
    type: config.elasticsearch.indexTypes[5],
    body: query,
    _sourceInclude
  });

  return response;
}

const resolver = {
  Query: {
    reviews: (_, { search, filter, currentPage, pageSize, sort, _sourceInclude }, context, rootValue) =>
      list(search, filter, currentPage, pageSize, sort, context, rootValue, _sourceInclude)
  }
};

export default resolver;