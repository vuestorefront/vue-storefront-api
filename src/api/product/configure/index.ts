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
    filterUnavailableVariants = false
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
    const { selectedVariant, isDesiredProductFound } = getDesiredSelectedVariant(product, _configuration, { fallbackToDefaultWhenNoAvailable })

    if (selectedVariant) {
      if (!isDesiredProductFound) { // update the configuration
        configuration = getProductConfiguration({ product, selectedVariant, attribute })
      }

      setConfigurableProductOptionsAsync({ product, configuration, setConfigurableProductOptions }) // set the custom options

      product.is_configured = true

      omitSelectedVariantFields(selectedVariant)
    }
    if (!selectedVariant && setProductErrors) { // can not find variant anyway, even the default one
      product.errors.variants = 'No available product variants'
    }
    return Object.assign(product, omit((selectedVariant || {}), ['visibility']))
  } else {
    return product
  }
}

async function configureProducts ({
  products,
  attribute_metadata = [],
  configuration = {},
  options = {},
  request
}: ConfigureProductsParams) {
  const productAttributesMetadata = products.map(({ _source }) => _source.attribute_metadata || [])
  const attribute = transformMetadataToAttributes([attribute_metadata, ...productAttributesMetadata])

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
