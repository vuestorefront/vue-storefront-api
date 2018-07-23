import config from 'config';
import client from '../client';

const includes = [
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
  'status',
  'visibility',
  'weight',
  'description',
  'small_image',
  'thumbnail',
  'max_price',
  'minimal_price',
  'regular_price',
  'max_regular_price',
  'minimal_regular_price',
  'final_price',
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
];

async function searchList(search, filter, pageSize, currentPage, sort) {
  let allRecords = [];
  const response = await client.search({
    index: config.elasticsearch.index,
    type: 'product',
    body: {
      _source: {
        excludes: ''
      },
      query: {
        multi_match: {
          query: search,
          fields: ['name', 'description']
        }
      }
    }
  });

  response.hits.hits.forEach(function(hit) {
    allRecords.push(hit);
  });
  return allRecords;
}

const resolver = {
  Query: {
    //Product: (_, { id }) => search(id),
    products: (_, { search, filter, pageSize, currentPage, sort }) => searchList(search, filter, pageSize, currentPage, sort)
  }
};

export default resolver;
