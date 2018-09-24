import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function listAttributes(attributes, _sourceInclude) {
  let query = buildQuery({ filter: attributes, pageSize: 150, type: 'attribute' });

  if (_sourceInclude == undefined) {
    _sourceInclude = config.entities.attribute.includeFields
  }

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[3],
    body: query,
    _sourceInclude
  });

  return response;
}

const resolver = {
  Query: {
    customAttributeMetadata: (_, { attributes, _sourceInclude }) => listAttributes(attributes, _sourceInclude)
  }
};

export default resolver;
