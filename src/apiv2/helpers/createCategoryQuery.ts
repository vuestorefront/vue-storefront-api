import SearchQuery from './searchQuery'

interface CategorySearchParams {
  parentId: string,
  level: number,
  key: string,
  value: string,
  onlyActive: boolean,
  onlyNotEmpty: boolean
}

const createCategoryQuery = ({ parentId, level, key, value, onlyActive, onlyNotEmpty }: CategorySearchParams) => {
  let searchQuery = new SearchQuery()

  if (parentId) {
    searchQuery = searchQuery.applyFilter({ key: 'parent_id', value: { 'eq': parentId } })
  }

  if (level) {
    searchQuery = searchQuery.applyFilter({ key: 'level', value: { 'eq': level } })
  }

  if (key) {
    // if (Array.isArray(value)) {
    searchQuery = searchQuery.applyFilter({ key, value: { 'in': value.split(',') } })
    // } else {
    // searchQuery = searchQuery.applyFilter({ key, value: { 'eq': value }})
    // }
  }

  if (onlyActive === true) {
    searchQuery = searchQuery.applyFilter({ key: 'is_active', value: { 'eq': true } })
  }

  if (onlyNotEmpty === true) {
    searchQuery = searchQuery.applyFilter({ key: 'product_count', value: { 'gt': 0 } })
  }

  return searchQuery
}

export default createCategoryQuery
