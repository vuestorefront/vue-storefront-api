import {
  setDefaultQty,
  setDefaultObjects,
  setParentSku,
  setFirstVariantAsDefault,
  setAssociatedProducts
} from './modificators';
import { hasConfigurableChildren } from './../helpers'
import { PreConfigureProductParams, PrepareProductsParams } from '../types'

function getIncludeExclude (reqUrl: string): { _sourceInclude: any, _sourceExclude: any } {
  const queryString = require('query-string');
  const { _source_include, _source_exclude } = queryString.parseUrl(reqUrl).query

  return {
    _sourceInclude: _source_include,
    _sourceExclude: _source_exclude
  }
}

export async function preConfigureProduct ({
  product,
  options: {
    setFirstVarianAsDefaultInURL = false,
    prefetchGroupProducts = false,
    indexName = ''
  } = {},
  _sourceInclude = null,
  _sourceExclude = null
}: PreConfigureProductParams) {
  const isFirstVariantAsDefaultInURL = setFirstVarianAsDefaultInURL && hasConfigurableChildren(product)

  // base product modifications
  setDefaultQty(product)
  setDefaultObjects(product)
  setParentSku(product)
  setFirstVariantAsDefault(product, { isFirstVariantAsDefaultInURL })

  // setup bundle or group product
  await setAssociatedProducts(product, { prefetchGroupProducts, indexName }, { _sourceInclude, _sourceExclude })

  return product;
};

async function prepareProducts ({ products, options }: PrepareProductsParams) {
  const includeExclude = getIncludeExclude(options.reqUrl)
  const mapProducts = await Promise.all(products.map(async (hit) => {
    const preparedProduct = await preConfigureProduct({ product: hit._source, options, ...includeExclude })
    return { ...hit, _source: preparedProduct }
  }))

  return mapProducts
}

export default prepareProducts
