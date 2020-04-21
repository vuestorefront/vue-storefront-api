import { Router } from 'express';
import { listProducts, renderListProducts } from './service'

export default ({ config, db }) => {
  const productApi = Router();

  productApi.get('/list', listProducts(config))
  productApi.get('/render-list', renderListProducts(config))

  return productApi
}
