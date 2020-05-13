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
import ProcessorFactory from '../../../processor/factory'

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
  productProcess
}) {
  if (filterUnavailableVariants) {
    filterOutUnavailableVariants(product, stockItems)
  }

  // setup bundle or group product
  if (prefetchGroupProducts) {
    await setGroupedProduct(product, { indexName, _sourceInclude, _sourceExclude, productProcess })
    await setBundleProducts(product, { indexName, _sourceInclude, _sourceExclude, productProcess })
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
  request,
  response
}: ConfigureProductsParams) {
  const productAttributesMetadata = products.map(({ _source }) => _source.attributes_metadata || [])
  const attribute = transformMetadataToAttributes([attributes_metadata, ...productAttributesMetadata])

  let stockItems = []
  if (options.filterUnavailableVariants) {
    stockItems = await getStockItems(products.map(({ _source }) => _source), request)
  }

  const productProcess = async (products) => {
    const factory = new ProcessorFactory(config)
    let resultProcessor = factory.getAdapter('product', options.indexName, request, response)
    if (!resultProcessor) { resultProcessor = factory.getAdapter('default', options.indexName, request, response) } // get the default processor
    try {
      const result = await resultProcessor.process(products, options.groupId)
      return result
    } catch (err) {
      console.error(err)
      return products
    }
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
      productProcess
    })
    return { ...hit, _source: configuredProduct }
  }))

  return configuredProducts
}

export default configureProducts
