import config from 'config';
import client from '../client';
import bodybuilder from 'bodybuilder';

async function search(ids, name, from, size) {
  let query = bodybuilder();
  query.from = from;
  query.size = size;

  if (ids) {
    query.orFilter('terms', 'id', ids);
  }
  if (name) {
    query.orFilter('match', 'name', { query: name, boost: 3 });
  }

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[1],
    body: query.build()
  });

  return response;
}

const resolver = {
  Query: {
    categories: (_, { ids, name, from, size }) => search(ids, name, from, size)
  }
};

export default resolver;
