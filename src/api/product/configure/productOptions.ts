import toString from 'lodash/toString'
import omit from 'lodash/omit'

function optionLabel (attribute, { attributeKey, searchBy = 'code', optionId }) {
  if (!attribute.labels) {
    attribute.labels = {}
  }
  let attrCache = attribute.labels[attributeKey]

  if (attrCache) {
    let label = attrCache[optionId]

    if (label) {
      return label
    }
  }
  const attr = attribute['list_by_' + searchBy][attributeKey]
  if (attr) {
    const opt = attr.options.find((op) => toString(op.value) === toString(optionId))

    if (opt) {
      if (!attribute.labels[attributeKey]) {
        attribute.labels[attributeKey] = {}
      }
      attribute.labels[attributeKey][optionId] = opt.label
      return opt ? opt.label : optionId
    } else {
      return optionId
    }
  } else {
    return optionId
  }
}

function getAttributeCode (option, attribute) {
  const attribute_code = option.attribute_code
    ? option.attribute_code
    : option.attribute_id && (attribute.list_by_id[option.attribute_id] || {}).attribute_code
  return attribute_code || option.label.toLowerCase()
}

function getSelectedOption (selectedVariant, attributeCode, option) {
  let selectedOption = (selectedVariant.custom_attributes || []).find((a) => a.attribute_code === attributeCode)
  selectedOption = selectedOption || {
    attribute_code: attributeCode,
    value: selectedVariant[attributeCode]
  }
  if (option.values && option.values.length) {
    const selectedOptionMeta = option.values.find(ov => ov.value_index === selectedOption.value)
    if (selectedOptionMeta) {
      selectedOption.label = selectedOptionMeta.label
        ? selectedOptionMeta.label
        : selectedOptionMeta.default_label
    }
  }
  return selectedOption
}

export function getProductConfiguration ({ product, selectedVariant, attribute }) {
  const currentProductOption = {}
  const configurableOptions = product.configurable_options || []
  for (const option of configurableOptions) {
    const attributeCode = getAttributeCode(option, attribute)
    const selectedOption = getSelectedOption(selectedVariant, attributeCode, option)
    const label = selectedOption.label
      ? selectedOption.label
      : optionLabel(attribute, {
        attributeKey: selectedOption.attribute_code,
        searchBy: 'code',
        optionId: selectedOption.value
      })
    currentProductOption[attributeCode] = {
      attribute_code: attributeCode,
      id: String(selectedOption.value),
      label: label
    }
  }
  return currentProductOption
}

export function getAllProductOptions ({ configurableOptions, configuration }) {
  const product_option = {
    extension_attributes: {
      custom_options: [],
      configurable_item_options: [],
      bundle_options: []
    }
  }
  /* eslint camelcase: "off" */
  product_option.extension_attributes.configurable_item_options = Object.keys(configuration)
    .map((key) => configuration[key])
    .filter((configOption) =>
      configOption &&
        configOption.attribute_code &&
        configOption.attribute_code !== 'price'
    )
    .map((configOption) => ({
      configOption,
      productOption: configurableOptions.find((productConfigOption) => productConfigOption.attribute_code === configOption.attribute_code)
    }))
    .filter(({ productOption }) => productOption)
    .map(({ configOption, productOption }) => ({
      option_id: Number(productOption.attribute_id),
      option_value: Number(configOption.id),
      label: productOption.label || configOption.attribute_code,
      value: configOption.label
    }))

  return product_option
}

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
