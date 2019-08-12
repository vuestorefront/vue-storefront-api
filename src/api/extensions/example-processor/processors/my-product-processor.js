class MyProductProcessor {
  constructor (config, request) {
    this._request = request
    this._config = config
  }

  process (productList) {
    // Product search results can be modified here.
    // For example, the following would add a paragraph to the short description of every product
    //
    // for (const prod of productList) {
    //   prod._source.short_description = prod._source.short_description + '<p class="cl-red fs-large">Free Shipping Today Only!</p>'
    // }
    //
    // For a real-life example processor, see src/platform/magento2/tax.js
    // For more details and another example, see https://docs.vuestorefront.io/guide/extensions/extensions-to-modify-results.html
    return productList
  }
}

module.exports = MyProductProcessor
