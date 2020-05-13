import { hasConfigurableChildren } from './../helpers';
import { ConfigureProductsParams, ConfigureProductsOptions } from './../types';
import cloneDeep from 'lodash/cloneDeep'
import { getSelectedVariant, omitSelectedVariantFields } from './selectedVariant';
import { transformMetadataToAttributes } from './attributes';
import { getProductConfiguration, setConfigurableProductOptionsAsync } from './productOptions';
import { filterOutUnavailableVariants, getStockItems } from './stock';
import queryString from 'query-string';
import { setGroupedProduct, setBundleProducts } from './associatedProducts';
import config from 'config'
import PlatformFactory from '../../../platform/factory';

async function configureProductAsync ({
  product,
  configuration,
  attribute,
  options: {
    fallbackToDefaultWhenNoAvailable = true,
    setProductErrors = true,
    setConfigurableProductOptions = true,
    filterUnavailableVariants = false,
    assignProductConfiguration = false,
    separateSelectedVariant = false,
    prefetchGroupProducts = false,
    indexName = ''
  } = {},
  stockItems = [],
  _sourceInclude,
  _sourceExclude,
  taxProcess
}) {
  if (filterUnavailableVariants) {
    filterOutUnavailableVariants(product, stockItems)
  }

  // setup bundle or group product
  if (prefetchGroupProducts) {
    await setGroupedProduct(product, { indexName, _sourceInclude, _sourceExclude, taxProcess })
    await setBundleProducts(product, { indexName, _sourceInclude, _sourceExclude, taxProcess })
  }

  // setup configurable product
  if (hasConfigurableChildren(product)) {
    // we don't want to modify configuration object
    let _configuration = cloneDeep(configuration)

    // find selected variant by configuration
    const selectedVariant = getSelectedVariant(product, _configuration, { fallbackToDefaultWhenNoAvailable })

    if (selectedVariant) {
      _configuration = getProductConfiguration({ product, selectedVariant, attribute })

      setConfigurableProductOptionsAsync({ product, configuration: _configuration, setConfigurableProductOptions }) // set the custom options

      product.is_configured = true

      omitSelectedVariantFields(selectedVariant)
    }
    if (!selectedVariant && setProductErrors) { // can not find variant anyway, even the default one
      product.errors.variants = 'No available product variants'
    }

    const configuredProduct = {
      ...product,
      ...(assignProductConfiguration ? { configuration: _configuration } : {})
    }
    return {
      ...configuredProduct,
      ...(separateSelectedVariant ? { selectedVariant } : selectedVariant)
    }
  }

  return product
}

function getIncludeExclude (reqUrl: string): { _sourceInclude: any, _sourceExclude: any } {
  const { _source_include, _source_exclude } = queryString.parseUrl(reqUrl).query

  return {
    _sourceInclude: _source_include,
    _sourceExclude: _source_exclude
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

  const taxProcess = (products) => {
    const factory = new PlatformFactory(config, request)
    const taxProcessor = factory.getAdapter((config as any).platform, 'tax', options.indexName, (config as any).tax.defaultCountry)
    taxProcessor.process(products, options.groupId)
  }

  const includeExclude = getIncludeExclude(request.url)
  const configuredProducts = await Promise.all(products.map(async (hit) => {
    const configuredProduct = await configureProductAsync({
      product: hit._source,
      configuration,
      attribute,
      options: options as ConfigureProductsOptions,
      stockItems,
      ...includeExclude,
      taxProcess
    })
    return { ...hit, _source: configuredProduct }
  }))

  return configuredProducts
}

export default configureProducts
