export const hasConfigurableChildren = (product) => product && product.configurable_children && product.configurable_children.length
export const isGroupedProduct = product => product.type_id === 'grouped'
export const isBundleProduct = product => product.type_id === 'bundle'
