import config from 'config';
import map from 'lodash/map';
import bodybuilder from 'bodybuilder';

export function buildQuery (page, filter, range, sort, search) {
  let query = bodybuilder();
  if (page == 'catalogsearch') {
    query
      .orQuery('match', 'name', { query: search, boost: 3 })
      .orQuery('match', 'category.name', { query: search, boost: 1 })
      .orQuery('match', 'short_description', { query: search, boost: 2 })
      .orQuery('match', 'description', { query: search, boost: 1 });
  }
  query._sourceInclude = config.entities.productListWithChildren.includeFields;
  query._sourceExclude = config.entities.productListWithChildren.excludeFields;
  query.filter('range', 'visibility', { gte: 3, lte: 4 });

  map(filter, function(value, key) {
    query.filter('terms', key, value);
    query.agg('terms', key);
  });

  map(range, function(value, key) {
    query.filter('range', key, value);
    query.agg('stats', key);
  });

  map(sort, function(value, key) {
    query.sort(key, value);
  });

  return query.build();
}