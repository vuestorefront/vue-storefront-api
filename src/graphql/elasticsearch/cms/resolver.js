import config from 'config';
import client from '../client';
import { buildQuery } from '../queryBuilder';

async function list (filter, currentPage, pageSize = 200, _source_include, type) {
  let query = buildQuery({ filter, currentPage, pageSize, _source_include, type });

  const response = await client.search({
    index: config.elasticsearch.indices[0],
    body: query,
    type,
    _source_include
  });
  const items = buildItems(response.body)

  return items;
}

function buildItems (response) {
  response.items = []
  response.hits.hits.forEach(hit => {
    let item = hit._source
    item._score = hit._score
    response.items.push(item)
  });

  return response;
}

const resolver = {
  Query: {
    cmsPages: (_, { filter, currentPage, pageSize, _sourceInclude, type = 'cms_page' }) =>
      list(filter, currentPage, pageSize, _sourceInclude, type),
    cmsBlocks: (_, { filter, currentPage, pageSize, _sourceInclude, type = 'cms_block' }) =>
      list(filter, currentPage, pageSize, _sourceInclude, type),
    cmsHierarchies: (_, { filter, currentPage, pageSize, _sourceInclude, type = 'cms_hierarchy' }) =>
      list(filter, currentPage, pageSize, _sourceInclude, type)
  }
};

export default resolver;
