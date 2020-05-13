import { preConfigureProduct } from '../prepare';
import { queryProducts } from './../service'
import { isGroupedProduct, isBundleProduct } from './../helpers'
import config from 'config'

async function setProductLink (productLink, associatedProduct) {
  if (associatedProduct) {
    productLink.product = preConfigureProduct(associatedProduct)
    productLink.product.qty = productLink.qty || 1
  } else {
    console.error('Product not found', productLink.linked_product_sku || productLink.sku)
  }
}

export async function setBundleProducts (product, { indexName, _sourceInclude, _sourceExclude, productProcess }) {
  if (isBundleProduct(product) && product.bundle_options) {
    const skus = product.bundle_options
      .map((bundleOption) => bundleOption.product_links.map((productLink) => productLink.sku))
      .reduce((acc, next) => acc.concat(next), [])
    let associatedProducts = await queryProducts(config)(
      {
        filter: { sku: { in: skus } },
        pageSize: skus.length
      },
      {
        indexName,
        _sourceInclude,
        _sourceExclude
      }
    )

    associatedProducts = (await productProcess(associatedProducts)).map((res) => res._source)

    for (const bundleOption of product.bundle_options) {
      for (const productLink of bundleOption.product_links) {
        const associatedProduct = associatedProducts.find((associatedProduct) => associatedProduct.sku === productLink.sku)
        setProductLink(productLink, associatedProduct)
      }
    }
  }
}

export async function setGroupedProduct (product, { indexName, _sourceInclude, _sourceExclude, productProcess }) {
  if (isGroupedProduct(product) && product.product_links) {
    const productLinks = product.product_links.filter((productLink) => productLink.link_type === 'associated' && productLink.linked_product_type === 'simple')
    const skus = productLinks.map((productLink) => productLink.linked_product_sku)
    let associatedProducts = await queryProducts(config)(
      {
        filter: { sku: { in: skus } },
        pageSize: skus.length
      },
      {
        indexName,
        _sourceInclude,
        _sourceExclude
      }
    )

    associatedProducts = (await productProcess(associatedProducts)).map((res) => res._source)

    for (const productLink of productLinks) {
      const associatedProduct = associatedProducts.find((associatedProduct) => associatedProduct.sku === productLink.linked_product_sku)
      setProductLink(productLink, associatedProduct)
    }
  }
}
