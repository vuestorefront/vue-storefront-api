import { hasConfigurableChildren } from './../helpers';
import { ConfigureProductsParams } from './../types';
import omit from 'lodash/omit'
import toString from 'lodash/toString'
import cloneDeep from 'lodash/cloneDeep'

const _internalMapOptions = (productOption) => {
  const optionsMapped = productOption.extension_attributes.configurable_item_options
    .map((option) => ({ label: option.label, value: option.value }))

  productOption.extension_attributes.configurable_item_options = productOption.extension_attributes.configurable_item_options
    .map((option) => omit(option, ['label', 'value']))

  return optionsMapped
}

/**
 * Helper method for getting attribute name - TODO: to be moved to external/shared helper
 *
 * @param {String} attributeCode
 * @param {String} optionId - value to get label for
 */
// export function optionLabel (state, { attributeKey, searchBy = 'code', optionId }) {
//   let attrCache = state.labels[attributeKey]

//   if (attrCache) {
//     let label = attrCache[optionId]

//     if (label) {
//       return label
//     }
//   }
//   let attr = state['list_by_' + searchBy][attributeKey]
//   if (attr) {
//     let opt = attr.options.find((op) => { // TODO: cache it in memory
//       if (toString(op.value) === toString(optionId)) {
//         return op
//       }
//     }) // TODO: i18n support with  multi-website attribute names

//     if (opt) {
//       if (!state.labels[attributeKey]) {
//         state.labels[attributeKey] = {}
//       }
//       state.labels[attributeKey][optionId] = opt.label
//       return opt ? opt.label : optionId
//     } else {
//       return optionId
//     }
//   } else {
//     return optionId
//   }
// }

/**
 * check if object have an image
 */
export const hasImage = (product) => product && product.image && product.image !== 'no_selection'

const getVariantWithLowestPrice = (prevVariant, nextVariant) => {
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
const getConfigurationMatchLevel = (configuration, variant): number => {
  if (!variant || !configuration) return 0
  const configProperties = Object.keys(omit(configuration, ['price']))
  return configProperties
    .map(configProperty => {
      const variantPropertyId = variant[configProperty]
      if (configuration[configProperty] === null) {
        return false
      }

      return [].concat(configuration[configProperty])
        .map(f => toString(f.id))
        .includes(toString(variantPropertyId))
    })
    .filter(Boolean)
    .length
}

export function findConfigurableChildAsync ({ product, configuration = null, selectDefaultChildren = false, availabilityCheck = true, listOutOfStockProducts = true }) {
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

export function setConfigurableProductOptionsAsync ({ product, configuration, setConfigurableProductOptions }) {
  if (!setConfigurableProductOptions) return

  if (product.configurable_options) {
    const product_option = {
      extension_attributes: {
        custom_options: [],
        configurable_item_options: [],
        bundle_options: []
      }
    }
    /* eslint camelcase: "off" */
    const configurable_item_options = product_option.extension_attributes.configurable_item_options
    for (const configKey of Object.keys(configuration)) {
      const configOption = configuration[configKey]
      if (configOption.attribute_code && configOption.attribute_code !== 'price') {
        const option = product.configurable_options.find(co => co.attribute_code === configOption.attribute_code)

        if (!option) {
          console.error('Wrong option id for setProductOptions', configOption.attribute_code)
          return null
        }

        let existingOption = configurable_item_options.find(cop => cop.option_id === option.attribute_id)
        if (!existingOption) {
          existingOption = {
            option_id: option.attribute_id,
            option_value: configOption.id,
            label: option.label || configOption.attribute_code,
            value: configOption.label
          }
          configurable_item_options.push(existingOption)
        }
        existingOption.option_value = configOption.id
        existingOption.label = option.label || configOption.attribute_code
        existingOption.value = configOption.label
      }
    }
    product.options = _internalMapOptions(product_option)
    product.product_option = product_option
  }
}

export function populateProductConfigurationAsync ({ product, selectedVariant, attribute }) {
  const configuration = {}
  if (product.configurable_options) {
    for (let option of product.configurable_options) {
      let attribute_code
      let attribute_label
      if (option.attribute_code) {
        attribute_code = option.attribute_code
        attribute_label = option.label ? option.label : (option.frontend_label ? option.frontend_label : option.default_frontend_label)
      } else {
        if (option.attribute_id) {
          let attr = attribute.list_by_id[option.attribute_id]
          if (!attr) {
            console.error('Wrong attribute given in configurable_options - can not find by attribute_id', option)
            continue
          } else {
            attribute_code = attr.attribute_code
            attribute_label = attr.frontend_label ? attr.frontend_label : attr.default_frontend_label
          }
        } else {
          console.error('Wrong attribute given in configurable_options - no attribute_code / attribute_id', option)
        }
      }
      let selectedOption = null
      if (selectedVariant.custom_attributes) {
        selectedOption = selectedVariant.custom_attributes.find((a) => a.attribute_code === attribute_code)
      } else {
        selectedOption = {
          attribute_code: attribute_code,
          value: selectedVariant[attribute_code]
        }
      }
      if (option.values && option.values.length) {
        const selectedOptionMeta = option.values.find(ov => ov.value_index === selectedOption.value)
        if (selectedOptionMeta) {
          selectedOption.label = selectedOptionMeta.label ? selectedOptionMeta.label : selectedOptionMeta.default_label
          selectedOption.value_data = selectedOptionMeta.value_data
        }
      }

      const confVal = {
        attribute_code: attribute_code,
        id: selectedOption.value,
        label: selectedOption.label ? selectedOption.label : /* if not set - find by attribute */optionLabel(attribute, { attributeKey: selectedOption.attribute_code, searchBy: 'code', optionId: selectedOption.value })
      }
      configuration[attribute_code] = confVal
    }
  }
  return selectedVariant
}

const setCustomAttributesForChild = (product) => {
  // handle custom_attributes for easier comparing in the future
  product.configurable_children.forEach((child) => {
    let customAttributesAsObject = {}
    if (child.custom_attributes) {
      child.custom_attributes.forEach((attr) => {
        customAttributesAsObject[attr.attribute_code] = attr.value
      })
      // add values from custom_attributes in a different form
      Object.assign(child, customAttributesAsObject)
    }
  })
}

export const configureProductAsync = ({
  product,
  configuration,
  selectDefaultVariant = true,
  fallbackToDefaultWhenNoAvailable = true,
  setProductErorrs = false,
  setConfigurableProductOptions = true
}) => {
  let _configuration = cloneDeep(configuration)

  if (hasConfigurableChildren(product)) {
    setCustomAttributesForChild(product)
    // find selected variant
    let desiredProductFound = false
    let selectedVariant = findConfigurableChildAsync({ product, configuration: _configuration, availabilityCheck: true })
    if (!selectedVariant) {
      if (fallbackToDefaultWhenNoAvailable) {
        selectedVariant = findConfigurableChildAsync({ product, selectDefaultChildren: true, availabilityCheck: true }) // return first available child
        desiredProductFound = false
      } else {
        desiredProductFound = false
      }
    } else {
      desiredProductFound = true
    }

    if (selectedVariant) {
      if (!desiredProductFound && selectDefaultVariant /** don't change the state when no selectDefaultVariant is set */) { // update the configuration
        _configuration = populateProductConfigurationAsync({ product, selectedVariant })
        setConfigurableProductOptionsAsync({ product: product, configuration: _configuration, setConfigurableProductOptions }) // set the custom options
      }
      product.is_configured = true

      if (setConfigurableProductOptions && !selectDefaultVariant && !(Object.keys(_configuration).length === 1 && _configuration.sku)) {
        // the condition above: if selectDefaultVariant - then "setCurrent" is seeting the configurable options; if configuration = { sku: '' } -> this is a special case when not configuring the product but just searching by sku
        setConfigurableProductOptionsAsync({ product: product, configuration: _configuration, setConfigurableProductOptions }) // set the custom options
      }
      const fieldsToOmit = ['name']
      if (!hasImage(selectedVariant)) fieldsToOmit.push('image')
      selectedVariant = omit(selectedVariant, fieldsToOmit) // We need to send the parent SKU to the Magento cart sync but use the child SKU internally in this case
    }
    if (!selectedVariant && setProductErorrs) { // can not find variant anyway, even the default one
      product.errors.variants = 'No available product variants'
    }
    return Object.assign(product, omit((selectedVariant || {}), ['visibility']))
  } else {
    return product
  }
}

const configureProducts = ({
  products,
  attribute_metadata,
  options = {}
}: ConfigureProductsParams) => {
  // console.log(products)
  return products
}

export default configureProducts
