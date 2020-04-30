export type Product = any

interface PrepareProductsOptions {
  setFirstVarianAsDefaultInURL?: boolean,
  prefetchGroupProducts?: boolean,
  indexName?: string,
  reqUrl?: string
}

export interface PreConfigureProductParams {
  product: Product,
  options?: PrepareProductsOptions,
  _sourceInclude: any,
  _sourceExclude: any
}

export interface PrepareProductsParams {
  products: Product[],
  options?: PrepareProductsOptions
}

export interface ConfigureProductsParams {
  products: Product[],
  attribute_metadata?: any[],
  options?: PrepareProductsOptions
}
