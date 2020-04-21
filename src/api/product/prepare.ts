import { queryProducts } from './service';
import { hasConfigurableChildren, isGroupedProduct, isBundleProduct } from './helpers';
import config from 'config'

type Product = any
type AttributeMetadata = any
interface PrepareProductsOptions {
  setFirstVarianAsDefaultInURL?: boolean,
  prefetchGroupProducts?: boolean,
  indexName?: string
}

const setDefaultQty = (product) => {
  // set product quantity to 1
  if (!product.qty) {
    product.qty = 1
  }
}

const addParentSku = (product) => {
  if (!product.parentSku) {
    product.parentSku = product.sku;
  }
}

const setFirstVariantAsDefault = (product, isFirstVariantAsDefaultInURL) => {
  if (isFirstVariantAsDefaultInURL) {
    product.sku = product.configurable_children[0].sku;
  }
}

const setDefaultObjects = (product) => {
  product.errors = {}; // this is an object to store validation result for custom options and others
  product.info = {};
}

const setProductLink = async (productLink, associatedProduct) => {
  if (associatedProduct) {
    productLink.product = await preConfigureProduct({ product: associatedProduct })
    productLink.product.qty = productLink.qty || 1
  } else {
    console.error('Product not found', productLink.linked_product_sku || productLink.sku)
  }
}

const setupAssociated = async (product, prefetchGroupProducts, indexName): Promise<any> => {
  if (!prefetchGroupProducts) return product

  if (isGroupedProduct(product) && product.product_links) {
    const productLinks = product.product_links.filter((productLink) => productLink.link_type === 'associated' && productLink.linked_product_type === 'simple')
    const skus = productLinks.map((productLink) => productLink.linked_product_sku)
    const associatedProducts = (await queryProducts(config)(
      {
        filter: { sku: { in: skus } },
        pageSize: skus.length
      },
      { indexName }
    )).map((res) => res._source)

    for (let productLink of productLinks) {
      const associatedProduct = associatedProducts.find((associatedProduct) => associatedProduct.sku === productLink.linked_product_sku)
      setProductLink(productLink, associatedProduct)
    }
  }

  if (isBundleProduct(product) && product.bundle_options) {
    const skus = product.bundle_options
      .map((bundleOption) => bundleOption.product_links.map((productLink) => productLink.sku))
      .reduce((acc, next) => acc.concat(next), [])
    const associatedProducts = (await queryProducts(config)(
      {
        filter: { sku: { in: skus } },
        pageSize: skus.length
      },
      { indexName }
    )).map((res) => res._source)

    for (let bundleOption of product.bundle_options) {
      for (let productLink of bundleOption.product_links) {
        const associatedProduct = associatedProducts.find((associatedProduct) => associatedProduct.sku === productLink.sku)
        setProductLink(productLink, associatedProduct)
      }
    }
  }

  return product
}

interface PreConfigureProductParams {
  product: Product,
  options?: PrepareProductsOptions
}
const preConfigureProduct = async ({
  product,
  options: {
    setFirstVarianAsDefaultInURL = false,
    prefetchGroupProducts = true,
    indexName = ''
  } = {}
}: PreConfigureProductParams) => {
  const isFirstVariantAsDefaultInURL = setFirstVarianAsDefaultInURL && hasConfigurableChildren(product)

  setDefaultQty(product)
  setDefaultObjects(product)
  addParentSku(product)
  setFirstVariantAsDefault(product, isFirstVariantAsDefaultInURL)
  await setupAssociated(product, prefetchGroupProducts, indexName)

  return product;
};

interface PrepareProductsParams {
  products: Product[],
  attribute_metadata?: AttributeMetadata[],
  options?: PrepareProductsOptions
}
const prepareProducts = async ({
  products,
  attribute_metadata,
  options = {}
}: PrepareProductsParams) => {
  const mapProducts = await Promise.all(products.map(async (hit) => {
    const preparedProduct = await preConfigureProduct({ product: hit._source, options })
    return { ...hit, _source: preparedProduct }
  }))
  return products
}

export default prepareProducts
