import config from 'config';
import client from '../client';

async function search(id) {
  let allRecords = '';
  const response = await client.search({
    index: config.elasticsearch.index,
    type: 'product',
    body: {
      query: {
        match: {
          id: id
        }
      }
    }
  });

  response.hits.hits.forEach(function(hit) {
    allRecords = hit._source;
  });

  return allRecords;
}

async function searchList(req) {
  let allRecords = [];
  const response = await client.search({
    index: config.elasticsearch.index,
    type: 'product',
    body: {
      _source: {
        includes: [
          'type_id',
          'sku',
          'name',
          'tax_class_id',
          'special_price',
          'special_to_date',
          'special_from_date',
          'price',
          'priceInclTax',
          'originalPriceInclTax',
          'originalPrice',
          'specialPriceInclTax',
          'id',
          'image',
          'sale',
          'new',
          'configurable_children.image',
          'configurable_children.sku',
          'configurable_children.price',
          'configurable_children.special_price',
          'configurable_children.priceInclTax',
          'configurable_children.specialPriceInclTax',
          'configurable_children.originalPrice',
          'configurable_children.originalPriceInclTax',
          'configurable_children.color',
          'configurable_children.size',
          'product_links',
          'url_key'
        ]
      },
      query: {
        multi_match: {
          query: req,
          fields: ['name', 'description']
        }
      }
    }
  });

  response.hits.hits.forEach(function(hit) {
    allRecords.push(hit._source);
  });
  console.log(response.hits.hits);
  return allRecords;
}

const resolver = {
  Query: {
    Product: (_, { id }) => search(id),
    ProductList: (_, { query }) => searchList(query)
  }
};

export default resolver;
