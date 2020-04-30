import { Product } from './../types';
import { preConfigureProduct } from './';
import { queryProducts } from './../service'
import { isGroupedProduct, isBundleProduct } from './../helpers'
import config from 'config'

export function setDefaultQty (product) {
  // set product quantity to 1
  if (!product.qty) {
    product.qty = 1
  }
}

export function setParentSku (product) {
  if (!product.parentSku) {
    product.parentSku = product.sku
  }
}

export function setFirstVariantAsDefault (product, { isFirstVariantAsDefaultInURL }) {
  if (isFirstVariantAsDefaultInURL) {
    product.sku = product.configurable_children[0].sku
  }
}

export function setDefaultObjects (product) {
  product.errors = {}; // this is an object to store validation result for custom options and others
  product.info = {};
}

async function setProductLink (productLink, associatedProduct, { _sourceInclude, _sourceExclude }) {
  if (associatedProduct) {
    productLink.product = await preConfigureProduct({ product: associatedProduct, _sourceInclude, _sourceExclude })
    productLink.product.qty = productLink.qty || 1
  } else {
    console.error('Product not found', productLink.linked_product_sku || productLink.sku)
  }
}

async function setBundleProducts (product, { indexName, _sourceInclude, _sourceExclude }) {
  if (isBundleProduct(product) && product.bundle_options) {
    const skus = product.bundle_options
      .map((bundleOption) => bundleOption.product_links.map((productLink) => productLink.sku))
      .reduce((acc, next) => acc.concat(next), [])
    const associatedProducts = (await queryProducts(config)(
      {
        filter: { sku: { in: skus } },
        pageSize: skus.length
      },
      {
        indexName,
        _sourceInclude,
        _sourceExclude
      }
    )).map((res) => res._source)

    for (const bundleOption of product.bundle_options) {
      for (const productLink of bundleOption.product_links) {
        const associatedProduct = associatedProducts.find((associatedProduct) => associatedProduct.sku === productLink.sku)
        await setProductLink(productLink, associatedProduct, { _sourceInclude, _sourceExclude })
      }
    }
  }
}

async function setGroupedProduct (product, { indexName, _sourceInclude, _sourceExclude }) {
  if (isGroupedProduct(product) && product.product_links) {
    const productLinks = product.product_links.filter((productLink) => productLink.link_type === 'associated' && productLink.linked_product_type === 'simple')
    const skus = productLinks.map((productLink) => productLink.linked_product_sku)
    const associatedProducts = (await queryProducts(config)(
      {
        filter: { sku: { in: skus } },
        pageSize: skus.length
      },
      {
        indexName,
        _sourceInclude,
        _sourceExclude
      }
    )).map((res) => res._source)

    for (const productLink of productLinks) {
      const associatedProduct = associatedProducts.find((associatedProduct) => associatedProduct.sku === productLink.linked_product_sku)
      await setProductLink(productLink, associatedProduct, { _sourceInclude, _sourceExclude })
    }
  }
}

export async function setAssociatedProducts (product, { prefetchGroupProducts, indexName }, { _sourceInclude, _sourceExclude }): Promise<Product> {
  if (!prefetchGroupProducts) return product

  await setGroupedProduct(product, { indexName, _sourceInclude, _sourceExclude })
  await setBundleProducts(product, { indexName, _sourceInclude, _sourceExclude })

  return product
}
