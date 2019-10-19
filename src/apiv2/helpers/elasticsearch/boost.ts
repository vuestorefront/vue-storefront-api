import config from 'config'

export default function getBoosts (attribute = '') {
  let searchableAttributes = [
  ]

  const configSearchableAttrs = config.get('elasticsearch.searchableAttributes')

  if (configSearchableAttrs && configSearchableAttrs[attribute]) {
    searchableAttributes = configSearchableAttrs[attribute]
  }

  if (searchableAttributes.hasOwnProperty('boost')) {
    return searchableAttributes['boost']
  }

  return 1
}
