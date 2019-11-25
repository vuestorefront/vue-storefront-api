import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder'
import { getIndexName } from '../mapping'
import { adjustQuery } from './../../../lib/elastic'

async function list (search, filter, currentPage, pageSize = 200, sort, context, rootValue, _sourceIncludes) {
  let query = buildQuery({ search, filter, currentPage, pageSize, sort, type: 'category' });

  if (_sourceIncludes === undefined) {
    _sourceIncludes = config.entities.category.includeFields
  }

  const response = await client.search(adjustQuery({
    index: getIndexName(context.req.url),
    body: query,
    _sourceIncludes
  }, 'category', config));

  return response.body;
}

const resolver = {
  Query: {
    categories: (_, { search, filter, currentPage, pageSize, sort, _sourceInclude }, context, rootValue) =>
      list(search, filter, currentPage, pageSize, sort, context, rootValue, _sourceInclude)
  }
};

export default resolver;
