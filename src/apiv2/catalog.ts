import { apiStatus } from '../lib/util';
import { Router } from 'express';
import search from './helpers/search'
import SearchQuery from './helpers/searchQuery'

export default ({ config, db }) => {
  let catalogApi = Router()

  catalogApi.get('/products', async (req, res) => {
    const skus = req.query.skus.split(',')
    let searchQuery = new SearchQuery()
    searchQuery = searchQuery.applyFilter({ key: 'sku', value: { 'in': skus } })
    const result = await search(config, 'product', req.query.locale, searchQuery)
    const response = result.resBody.hits.hits.map(({ _source }) => _source)

    apiStatus(res, response, 200);
  })

  return catalogApi
}
