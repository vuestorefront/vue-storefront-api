import { Product } from './../types';
import { preConfigureProduct } from './';
import { queryProducts } from './../service'
import { isGroupedProduct, isBundleProduct } from './../helpers'
import config from 'config'

export const setDefaultQty = (product) => {
  // set product quantity to 1
  if (!product.qty) {
    product.qty = 1
  }
}

export const setParentSku = (product) => {
  if (!product.parentSku) {
    product.parentSku = product.sku
  }
}

export const setFirstVariantAsDefault = (product, isFirstVariantAsDefaultInURL) => {
  if (isFirstVariantAsDefaultInURL) {
    product.sku = product.configurable_children[0].sku
  }
}

export const setDefaultObjects = (product) => {
  product.errors = {}; // this is an object to store validation result for custom options and others
  product.info = {};
}

export const setProductLink = async (productLink, associatedProduct) => {
  if (associatedProduct) {
    productLink.product = await preConfigureProduct({ product: associatedProduct })
    productLink.product.qty = productLink.qty || 1
  } else {
    console.error('Product not found', productLink.linked_product_sku || productLink.sku)
  }
}

export const setAssociatedProducts = async (product, prefetchGroupProducts, indexName): Promise<Product> => {
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
