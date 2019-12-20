import bodybuilder from 'bodybuilder';
import getBoosts from '../../lib/boost'
import map from 'lodash/map';
import getMapping from './mapping'
import config from 'config'

function processNestedFieldFilter (attribute, value) {
  let processedFilter = {
    'attribute': attribute,
    'value': value
  };
  let filterAttributeKeys = Object.keys(value);
  for (let filterAttributeKey of filterAttributeKeys) {
    if (value[filterAttributeKey] && !Array.isArray(value[filterAttributeKey]) && typeof value[filterAttributeKey] === 'object') {
      processedFilter = processNestedFieldFilter(attribute + '.' + filterAttributeKey, value[filterAttributeKey]);
    }
  }
  return processedFilter;
}

/**
 *
 * @param {Object} object
 * @param {String} scope
 * @returns {boolean}
 */
function checkIfObjectHasScope ({ object, scope }) {
  return object.scope === scope || (Array.isArray(object.scope) && object.scope.find(scrope => scrope === scope));
}

function applyFilters (filter, query, type) {
  if (filter.length === 0) {
    return query
  }
  const rangeOperators = ['gt', 'lt', 'gte', 'lte', 'moreq', 'from', 'to']
  const optionsPrefix = '_options'

  const appliedFilters = [];
  if (filter) {
    for (var attribute in filter) {
      let processedFilter = processNestedFieldFilter(attribute, filter[attribute])
      let appliedAttributeValue = processedFilter['value']
      const scope = appliedAttributeValue.scope || 'default';
      delete appliedAttributeValue.scope;
      appliedFilters.push({
        attribute: processedFilter['attribute'],
        value: appliedAttributeValue,
        scope: scope
      });
    }
  }

  // process applied filters
  if (appliedFilters.length > 0) {
    let hasCatalogFilters = false;

    // apply default filters
    appliedFilters.forEach((filter) => {
      if (checkIfObjectHasScope({ object: filter, scope: 'default' }) && Object.keys(filter.value).length) {
        if (rangeOperators.every(rangeOperator => Object.prototype.hasOwnProperty.call(filter.value, rangeOperator))) {
          // process range filters
          query = query.filter('range', filter.attribute, filter.value);
        } else {
          // process terms filters
          filter.value = filter.value[Object.keys(filter.value)[0]];
          if (!Array.isArray(filter.value)) {
            filter.value = [filter.value];
          }
          query = query.filter('terms', getMapping(filter.attribute), filter.value)
        }
      } else if (filter.scope === 'catalog') {
        hasCatalogFilters = true;
      }
    })

    // apply catalog scope filters
    let attrFilterBuilder = (filterQr, attrPostfix = '') => {
      appliedFilters.forEach((catalogfilter) => {
        const valueKeys = Object.keys(catalogfilter.value);
        if (checkIfObjectHasScope({ object: catalogfilter, scope: 'catalog' }) && valueKeys.length) {
          const isRange = valueKeys.filter(value => rangeOperators.indexOf(value) !== -1)
          if (isRange.length) {
            let rangeAttribute = catalogfilter.attribute
            if (rangeAttribute === 'price') {
              rangeAttribute = 'final_price'
            }
            // process range filters
            filterQr = filterQr.andFilter('range', rangeAttribute, catalogfilter.value);
          } else {
            // process terms filters
            let newValue = catalogfilter.value[Object.keys(catalogfilter.value)[0]]
            if (!Array.isArray(newValue)) {
              newValue = [newValue];
            }
            if (attrPostfix === '') {
              filterQr = filterQr.andFilter('terms', getMapping(catalogfilter.attribute), newValue)
            } else {
              filterQr = filterQr.andFilter('terms', catalogfilter.attribute + attrPostfix, newValue)
            }
          }
        }
      })
      return filterQr
    }

    if (hasCatalogFilters) {
      query = query.filterMinimumShouldMatch(1).orFilter('bool', (b) => attrFilterBuilder(b))
        .orFilter('bool', (b) => attrFilterBuilder(b, optionsPrefix).filter('match', 'type_id', 'configurable')); // the queries can vary based on the product type
    }

    // Add aggregations for filters
    if (appliedFilters.length > 0 && type === 'product') {
      for (let attrToFilter of appliedFilters) {
        if (attrToFilter.scope === 'catalog') {
          if (attrToFilter.attribute !== 'price') {
            query = query.aggregation('terms', getMapping(attrToFilter.attribute))
            query = query.aggregation('terms', attrToFilter.attribute + optionsPrefix)
          } else {
            query = query.aggregation('terms', attrToFilter.attribute)
            query.aggregation('range', 'price', {
              ranges: [
                { from: 0, to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 150 },
                { from: 150 }
              ]
            })
          }
        }
      }
    }
  }

  return query;
}

function applySearchQuery (search, query) {
  if (search !== '') {
    query = query.andQuery('bool', b => b.orQuery('match_phrase_prefix', 'name', { query: search, boost: getBoosts('name'), slop: 2 })
      .orQuery('match_phrase', 'category.name', { query: search, boost: getBoosts('category.name') })
      .orQuery('match_phrase', 'short_description', { query: search, boost: getBoosts('short_description') })
      .orQuery('match_phrase', 'description', { query: search, boost: getBoosts('description') })
      .orQuery('bool', b => b.orQuery('terms', 'sku', search.split('-'))
        .orQuery('terms', 'configurable_children.sku', search.split('-'))
        .orQuery('match_phrase', 'sku', { query: search, boost: getBoosts('sku') })
        .orQuery('match_phrase', 'configurable_children.sku', { query: search, boost: getBoosts('configurable_children.sku') }))
    );
  }

  return query;
}

function applySort (sort, query) {
  if (sort) {
    map(sort, (value, key) => {
      query.sort(key, value);
    });
  }

  return query;
}

export function buildQuery ({
  filter = [],
  sort = '',
  currentPage = 1,
  pageSize = 10,
  search = '',
  type = 'product'
}) {
  let query = bodybuilder();

  query = applySearchQuery(search, query);
  query = applyFilters(filter, query, type);
  query = applySort(sort, query);

  query = query.from((currentPage - 1) * pageSize).size(pageSize);

  let builtQuery = query.build()
  if (search !== '') {
    builtQuery['min_score'] = config.elasticsearch.min_score
  }

  return builtQuery;
}
