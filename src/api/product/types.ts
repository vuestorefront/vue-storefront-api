export type Product = any

interface PrepareProductsOptions {
  setFirstVariantAsDefaultInURL?: boolean,
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
  filterUnavailableVariants?: boolean,
  assignProductConfiguration?: boolean,
  separateSelectedVariant?: boolean
}

export interface ConfigureProductsParams {
  products: Product[],
  configuration: any,
  attributes_metadata?: any[],
  options?: ConfigureProductsOptions,
  request: any
}
