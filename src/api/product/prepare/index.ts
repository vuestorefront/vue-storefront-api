import { setDefaultQty, setDefaultObjects, setParentSku, setFirstVariantAsDefault, setAssociatedProducts } from './modificators';
import { hasConfigurableChildren } from './../helpers'
import { PreConfigureProductParams, PrepareProductsParams } from '../types'

export const preConfigureProduct = async ({
  product,
  options: {
    setFirstVarianAsDefaultInURL = false,
    prefetchGroupProducts = false,
    indexName = ''
  } = {}
}: PreConfigureProductParams) => {
  const isFirstVariantAsDefaultInURL = setFirstVarianAsDefaultInURL && hasConfigurableChildren(product)

  setDefaultQty(product)
  setDefaultObjects(product)
  setParentSku(product)
  setFirstVariantAsDefault(product, isFirstVariantAsDefaultInURL)
  await setAssociatedProducts(product, prefetchGroupProducts, indexName)

  return product;
};

const prepareProducts = async ({
  products,
  options = {}
}: PrepareProductsParams) => {
  const mapProducts = await Promise.all(products.map(async (hit) => {
    const preparedProduct = await preConfigureProduct({ product: hit._source, options })
    return { ...hit, _source: preparedProduct }
  }))

  return mapProducts
}

export default prepareProducts
