import config from 'config'

export default function getMapping (attribute, entityType = 'product') {
  let mapping = [
  ]

  if (typeof config.entities[entityType].filterFieldMapping !== 'undefined') {
    mapping = config.entities[entityType].filterFieldMapping
  }

  if (typeof mapping[attribute] !== 'undefined') {
    return mapping[attribute]
  }

  return attribute
}
