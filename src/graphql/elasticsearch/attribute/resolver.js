import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'

async function listAttributes (attributes, context, rootValue, _source_include) {
  let query = buildQuery({ filter: attributes, pageSize: 150, type: 'attribute' });

  if (_source_include === undefined) {
    _source_include = config.entities.attribute.includeFields
  }

  const response = await client.search({
    index: getIndexName(context.req.url),
    type: config.elasticsearch.indexTypes[3],
    body: query,
    _source_include
  });

  return response.body;
}

const resolver = {
  Query: {
    customAttributeMetadata: (_, { attributes, _sourceInclude }, context, rootValue) => listAttributes(attributes, context, rootValue, _sourceInclude)
  }
};

export default resolver;
