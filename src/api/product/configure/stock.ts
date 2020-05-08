import { hasConfigurableChildren } from '../helpers';
import config from 'config'
import PlatformFactory from './../../../../src/platform/factory';

function filterChildrenByStockitem (product, stockItems = []) {
  for (const stockItem of stockItems) {
    const confChild = product.configurable_children.find((child) => child.id === stockItem.product_id)
    if (!stockItem.is_in_stock || (confChild && confChild.status >= 2/* conf child is disabled */)) {
      product.configurable_children = product.configurable_children.filter((child) => child.id !== stockItem.product_id)
    } else {
      if (confChild) {
        confChild.stock = stockItem
      }
    }
  }
}

export function filterOutUnavailableVariants (product, stockItems = []) {
  const productStockItem = stockItems.find(p => p.product_id === product.id)
  product.stock = productStockItem
  if (productStockItem && !productStockItem.is_in_stock) {
    product.errors.variants = 'No available product variants'
  }

  if (product.type_id === 'configurable' && hasConfigurableChildren(product)) {
    filterChildrenByStockitem(stockItems, product)
  }
}

function getStockId (storeCode) {
  const storeView = (config as any).storeViews[storeCode]
  const stockId = storeView ? storeView.msi.stockId : (config as any).msi.defaultStockId
  return (config as any).msi.enabled ? stockId : null
}

export async function getStockItems (products, request) {
  const factory = new PlatformFactory(config as any, request)
  const stockProxy = factory.getAdapter((config as any).platform, 'stock')
  const skuArray = products.map(({ sku, configurable_children = [] }) => {
    const childSkus = configurable_children.map((c) => c.sku)
    return [sku, ...childSkus]
  }).reduce((acc, curr) => acc.concat(curr), [])
  const promisesList = []
  for (const sku of skuArray) {
    promisesList.push(stockProxy.check({
      sku,
      stockId: getStockId(request.query.storeCode)
    }))
  }
  try {
    const result = await Promise.all(promisesList)
    return result
  } catch (err) {
    console.log(err)
    return []
  }
}
