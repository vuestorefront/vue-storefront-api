import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'
import { adjustQuery } from './../../../lib/elastic'

async function taxrule (filter, context, rootValue) {
  let query = buildQuery({ filter, pageSize: 150, type: 'taxrule' });

  const response = await client.search(adjustQuery({
    index: getIndexName(context.req.url),
    body: query
  }, 'taxrule', config));

  return response.body;
}

const resolver = {
  Query: {
    taxrule: (_, { filter }, context, rootValue) => taxrule(filter, context, rootValue)
  }
};

export default resolver;
