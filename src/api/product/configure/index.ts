import { hasConfigurableChildren } from './../helpers';
import { ConfigureProductsParams } from './../types';
import omit from 'lodash/omit'
import cloneDeep from 'lodash/cloneDeep'
import { getDesiredSelectedVariant, omitSelectedVariantFields } from './selectedVariant';
import { setConfigurableProductOptionsAsync, setCustomAttributesForChild } from './modificators';
import { transformMetadataToAttributes } from './attributes';
import { getProductConfiguration } from './productOptions';
import { filterOutUnavailableVariants, getStockItems } from './stock';

function configureProductAsync ({
  product,
  configuration,
  attribute,
  options: {
    fallbackToDefaultWhenNoAvailable = true,
    setProductErrors = true,
    setConfigurableProductOptions = true,
    filterUnavailableVariants = false,
    assignProductConfiguration = false,
    separateSelectedVariant = false
  } = {},
  stockItems = []
}) {
  if (filterUnavailableVariants) {
    filterOutUnavailableVariants(product, stockItems)
  }

  if (hasConfigurableChildren(product)) {
    // we don't want to modify configuration object
    let _configuration = cloneDeep(configuration)

    setCustomAttributesForChild(product)

    // find selected variant
    const selectedVariant = getDesiredSelectedVariant(product, _configuration, { fallbackToDefaultWhenNoAvailable })

    if (selectedVariant) {
      _configuration = getProductConfiguration({ product, selectedVariant, attribute })

      setConfigurableProductOptionsAsync({ product, configuration: _configuration, setConfigurableProductOptions }) // set the custom options

      product.is_configured = true

      omitSelectedVariantFields(selectedVariant)
    }
    if (!selectedVariant && setProductErrors) { // can not find variant anyway, even the default one
      product.errors.variants = 'No available product variants'
    }

    const configuredProduct = Object.assign(
      product,
      (assignProductConfiguration
        ? { configuration: _configuration }
        : {}
      )
    )
    if (separateSelectedVariant) {
      return { ...configuredProduct, selectedVariant }
    }
    return { ...configuredProduct, ...selectedVariant }
  } else {
    return product
  }
}

async function configureProducts ({
  products,
  attributes_metadata = [],
  configuration = {},
  options = {},
  request
}: ConfigureProductsParams) {
  const productAttributesMetadata = products.map(({ _source }) => _source.attributes_metadata || [])
  const attribute = transformMetadataToAttributes([attributes_metadata, ...productAttributesMetadata])

  let stockItems = []
  if (options.filterUnavailableVariants) {
    stockItems = await getStockItems(products.map(({ _source }) => _source), request)
  }

  const configuredProducts = products.map((hit) => {
    const configuredProduct = configureProductAsync({
      product: hit._source,
      configuration,
      attribute,
      options: options as any,
      stockItems
    })
    return { ...hit, _source: configuredProduct }
  })
  return configuredProducts
}

export default configureProducts
