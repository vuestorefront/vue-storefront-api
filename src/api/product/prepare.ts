import { hasConfigurableChildren } from './helpers';

function setDefaultQty (product) {
  // set product quantity to 1
  if (!product.qty) {
    product.qty = 1
  }
}

function setParentSku (product) {
  if (!product.parentSku) {
    product.parentSku = product.sku
  }
}

function setDefaultObjects (product) {
  product.errors = {}; // this is an object to store validation result for custom options and others
  product.info = {};
}

function setCustomAttributesForChild (product) {
  if (!hasConfigurableChildren(product)) return
  // handle custom_attributes for easier comparing in the future
  product.configurable_children.forEach((child) => {
    let customAttributesAsObject = {}
    if (child.custom_attributes) {
      child.custom_attributes.forEach((attr) => {
        customAttributesAsObject[attr.attribute_code] = attr.value
      })
      // add values from custom_attributes in a different form
      Object.assign(child, customAttributesAsObject)
    }
  })
}

function setDefaultProductOptions (product) {
  if (product.product_option) return
  product.product_option = {
    extension_attributes: {
      custom_options: [],
      configurable_item_options: [],
      bundle_options: []
    }
  }
}

export function preConfigureProduct (product) {
  // base product modifications
  setDefaultQty(product)
  setDefaultObjects(product)
  setParentSku(product)
  setCustomAttributesForChild(product)
  setDefaultProductOptions(product)

  return product;
};

function prepareProducts (products) {
  const preparedProducts = products.map((hit) => {
    const preparedProduct = preConfigureProduct(hit._source)
    return { ...hit, _source: preparedProduct }
  })

  return preparedProducts
}

export default prepareProducts
