export type Product = any

export interface ConfigureProductsOptions {
  fallbackToDefaultWhenNoAvailable?: boolean,
  setProductErrors?: boolean,
  setConfigurableProductOptions?: boolean,
  filterUnavailableVariants?: boolean,
  assignProductConfiguration?: boolean,
  separateSelectedVariant?: boolean,
  prefetchGroupProducts?: boolean,
  indexName?: string,
  groupId?: string
}

export interface ConfigureProductsParams {
  products: Product[],
  configuration: any,
  attributes_metadata?: any[],
  options?: ConfigureProductsOptions,
  request: any,
  response: any
}
