import config from 'config';
import map from 'lodash/map';
import bodybuilder from 'bodybuilder';

function applyFilters(filter, search, query) {
  query._sourceInclude = config.entities.productListWithChildren.includeFields;
  query._sourceExclude = config.entities.productListWithChildren.excludeFields;
  query
    .filter('range', 'visibility', { gte: 2, lte: 4 })
    .filter('range', 'status', { gte: 0, lte: 2 });

  if (search != '') {
    query
      .orFilter('match', 'name', { query: search, boost: 3 })
      .orFilter('match', 'category.name', { query: search, boost: 1 })
      .orFilter('match', 'short_description', { query: search, boost: 2 })
      .orFilter('match', 'description', { query: search, boost: 1 });
  }

  if (filter) {
    map(filter, function(value, key) {
      switch (key) {
        case 'terms':
          map(value, function(v, k) {
            query.filter('terms', k, v);
            query.agg('terms', k);
          });
          break;
        case 'range':
          map(value, function(v, k) {
            query.filter('range', k, v);
            query.agg('stats', k);
          });
          break;
        default:
          map(value, function(v, k) {
            query.filter('terms', k, v);
            query.agg('terms', k);
          });
          break;
      }
    });
  }

  return query;
}

export function buildQuery(page, filter, sort, from, size, search = '') {
  let query = bodybuilder();
  query = applyFilters(page, filter, search, query);
  return query.build();
}
