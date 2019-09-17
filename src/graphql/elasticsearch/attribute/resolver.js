import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';
import { getIndexName } from '../mapping'

async function listAttributes (attributes, context, rootValue, _sourceInclude) {
  let query = buildQuery({ filter: attributes, pageSize: 150, type: 'attribute' });

  if (_sourceInclude === undefined) {
    _sourceInclude = config.entities.attribute.includeFields
  }

  const esQuery = {
    index: getIndexName(context.req.url),
    body: query,
    _sourceInclude
  };
  if (parseInt(config.elasticsearch.apiVersion) < 6) {
    esQuery.type = config.elasticsearch.indexTypes[3]
  }

  const response = await client.search(esQuery);

  return response;
}

const resolver = {
  Query: {
    customAttributeMetadata: (_, { attributes, _sourceInclude }, context, rootValue) => listAttributes(attributes, context, rootValue, _sourceInclude)
  }
};

export default resolver;
