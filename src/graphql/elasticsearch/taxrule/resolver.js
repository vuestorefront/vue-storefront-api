import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'

async function taxrule(filter, context, rootValue) {
  let query = buildQuery({ filter, pageSize: 150, type: 'taxrule' });

  const response = await client.search({
    index: getIndexName(context.req.url),
    type: config.elasticsearch.indexTypes[4],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    taxrule: (_, { filter }, context, rootValue) => taxrule(filter, context, rootValue)
  }
};

export default resolver;
