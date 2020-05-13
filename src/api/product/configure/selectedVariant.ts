import toString from 'lodash/toString'
import omit from 'lodash/omit'

function getVariantWithLowestPrice (prevVariant, nextVariant) {
  if (!prevVariant || !prevVariant.original_price_incl_tax) {
    return nextVariant
  }

  const prevPrice = prevVariant.price_incl_tax || prevVariant.original_price_incl_tax
  const nextPrice = nextVariant.price_incl_tax || nextVariant.original_price_incl_tax
  return nextPrice < prevPrice ? nextVariant : prevVariant
}

/**
 * Counts how much coniguration match for specific variant
 */
function getConfigurationMatchLevel (configuration, variant): number {
  if (!variant || !configuration) return 0
  const configProperties = Object.keys(omit(configuration, ['price']))
  return configProperties
    .map(configProperty => {
      const variantPropertyId = variant[configProperty]
      if (configuration[configProperty] === null) {
        return false
      }

      return [].concat(configuration[configProperty])
        .map(f => typeof f === 'object' ? toString(f.id) : f)
        .includes(toString(variantPropertyId))
    })
    .filter(Boolean)
    .length
}

function findConfigurableVariant ({ product, configuration = null, selectDefaultChildren = false, availabilityCheck = true, listOutOfStockProducts = true }) {
  const selectedVariant = product.configurable_children.reduce((prevVariant, nextVariant) => {
    if (availabilityCheck) {
      if (nextVariant.stock && !listOutOfStockProducts) {
        if (!nextVariant.stock.is_in_stock) {
          return prevVariant
        }
      }
    }
    if (nextVariant.status >= 2/** disabled product */) {
      return prevVariant
    }
    if (selectDefaultChildren) {
      return prevVariant || nextVariant // return first
    }
    if (configuration.sku && nextVariant.sku === configuration.sku) { // by sku or first one
      return nextVariant
    } else {
      const prevVariantMatch = getConfigurationMatchLevel(configuration, prevVariant)
      const nextVariantMatch = getConfigurationMatchLevel(configuration, nextVariant)

      if (prevVariantMatch === nextVariantMatch) {
        return getVariantWithLowestPrice(prevVariant, nextVariant)
      }

      return nextVariantMatch > prevVariantMatch ? nextVariant : prevVariant
    }
  }, undefined)
  return selectedVariant
}

export function getSelectedVariant (product, configuration, { fallbackToDefaultWhenNoAvailable }) {
  let selectedVariant = findConfigurableVariant({ product, configuration, availabilityCheck: true })
  if (!selectedVariant) {
    if (fallbackToDefaultWhenNoAvailable) {
      selectedVariant = findConfigurableVariant({ product, selectDefaultChildren: true, availabilityCheck: true }) // return first available child
    }
  }

  return selectedVariant
}

export function omitSelectedVariantFields (selectedVariant) {
  const hasImage = selectedVariant && selectedVariant.image && selectedVariant.image !== 'no_selection'
  const fieldsToOmit = ['name', 'visibility']
  if (!hasImage) fieldsToOmit.push('image')
  selectedVariant = omit(selectedVariant, fieldsToOmit)
}
