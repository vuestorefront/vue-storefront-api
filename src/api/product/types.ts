export type Product = any

interface PrepareProductsOptions {
  setFirstVarianAsDefaultInURL?: boolean,
  prefetchGroupProducts?: boolean,
  indexName?: string,
  reqUrl?: string
}

export interface PrepareProductParams {
  product: Product,
  options?: PrepareProductsOptions,
  _sourceInclude: any,
  _sourceExclude: any
}

export interface PrepareProductsParams {
  products: Product[],
  options?: PrepareProductsOptions
}

interface ConfigureProductsOptions {
  fallbackToDefaultWhenNoAvailable?: boolean,
  setProductErrors?: boolean,
  setConfigurableProductOptions?: boolean,
  filterUnavailableVariants?: boolean
}

export interface ConfigureProductsParams {
  products: Product[],
  configuration: any,
  attribute_metadata?: any[],
  options?: ConfigureProductsOptions,
  request: any
}
