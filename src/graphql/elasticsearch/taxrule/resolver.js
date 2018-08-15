import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function taxrule(filter) {
  let query = buildQuery({ filter, pageSize: 150, type: 'taxrule' });

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[4],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    taxrule: (_, { filter }) => taxrule(filter)
  }
};

export default resolver;
