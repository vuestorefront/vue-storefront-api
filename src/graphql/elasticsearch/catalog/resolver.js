import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function list(filter, sort, currentPage, pageSize, search, context, rootValue) {
  let query = buildQuery(filter, sort, currentPage, pageSize, search);

  const parseURL = context.req.url.replace(/^\/+|\/+$/g, '');
  let urlParts = parseURL.split('/');
  if (urlParts.length < 1) {
      throw new Error('Please provide following parameters: /graphql/<storeId>/');
  }
  const storeId = parseInt(urlParts[0])

  const response = await client.search({
    index: config.elasticsearch.indices[storeId],
    type: config.elasticsearch.indexTypes[0],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    products: (_, { search, filter, sort, currentPage, pageSize }, context, rootValue) =>
      list(filter, sort, currentPage, pageSize, search, context, rootValue)
  }
};

export default resolver;
