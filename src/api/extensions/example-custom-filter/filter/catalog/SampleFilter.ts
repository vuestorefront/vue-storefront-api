import { FilterInterface } from 'storefront-query-builder'

const filter: FilterInterface = {
  priority: 1,
  check: ({ operator, value, attribute, queryChain }) => attribute === 'custom-filter-name',
  filter ({ value, attribute, operator, queryChain }) {
    // Do you custom filter logic like: queryChain.filter('terms', attribute, value)
    return queryChain
  },
  mutator: (value) => typeof value !== 'object' ? { 'in': [value] } : value
}

export default filter
