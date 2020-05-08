import omit from 'lodash/omit'
import { getAllProductOptions } from './productOptions'

function getInternalOptionsFormat (productOption) {
  return productOption.extension_attributes.configurable_item_options
    .map(({ label, value }) => ({ label, value }))
}

function omitInternalOptionsFormat (productOption) {
  productOption.extension_attributes.configurable_item_options = productOption.extension_attributes.configurable_item_options
    .map((option) => omit(option, ['label', 'value']))
}

export function setConfigurableProductOptionsAsync ({ product, configuration, setConfigurableProductOptions }) {
  if (!setConfigurableProductOptions) return

  const configurableOptions = product.configurable_options

  if (!configurableOptions) return

  const productOptions = getAllProductOptions({ configurableOptions, configuration })

  product.options = getInternalOptionsFormat(productOptions)

  omitInternalOptionsFormat(productOptions)

  product.product_option = productOptions
}

export function setCustomAttributesForChild (product) {
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
