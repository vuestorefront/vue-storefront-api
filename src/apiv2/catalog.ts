import { apiStatus } from '../lib/util';
import { Router } from 'express';
import search from './helpers/search'
import SearchQuery from './helpers/searchQuery'
import createCategoryQuery from './helpers/createCategoryQuery'

export default ({ config, db }) => {
  let catalogApi = Router()

  catalogApi.get('/products', async (req, res) => {
    const { catId, skus } = req.query
    let searchQuery = new SearchQuery()
    searchQuery = searchQuery.applyFilter({ key: 'visibility', value: { 'in': [ 2, 3, 4 ] } })
    searchQuery = searchQuery.applyFilter({ key: 'status', value: { 'in': [ 0, 1 ] } })

    if (skus) {
      searchQuery = searchQuery.applyFilter({ key: 'sku', value: { 'in': skus.split(',') } })
    }

    if (catId) {
      searchQuery = searchQuery.applyFilter({ key: 'category_ids', value: { 'in': [catId] } })
    }

    const result = await search(config, 'product', req.query.locale, searchQuery)
    const response = result.resBody.hits.hits.map(({ _source }) => _source)

    apiStatus(res, response, 200);
  })

  catalogApi.get('/categories', async (req, res) => {
    const searchQuery = createCategoryQuery({
      ...req.query,
      onlyActive: !!req.query.onlyActive,
      onlyNotEmpty: !!req.query.onlyNotEmpty
    })
    const result = await search(config, 'category', req.query.locale, searchQuery)
    const response = result.resBody.hits.hits.map(({ _source }) => _source)
    apiStatus(res, response, 200);
  })

  return catalogApi
}
