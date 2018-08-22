import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function listAttributes(attributes) {
  let includeFields = config.entities.attribute.includeFields;
  let query = buildQuery({ filter: attributes, pageSize: 150, includeFields, type: 'attribute' });

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    type: config.elasticsearch.indexTypes[3],
    body: query
  });

  return response;
}

const resolver = {
  Query: {
    customAttributeMetadata: (_, { attributes }) => listAttributes(attributes)
  }
};

export default resolver;
