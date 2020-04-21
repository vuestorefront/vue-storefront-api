import PlatformFactory from '../../platform/factory';
import { apiStatus, sgnSrc, apiError } from './../../lib/util';
import { buildQuery } from './../../graphql/elasticsearch/queryBuilder';
import { adjustQuery, getClient as getElasticClient, getHits } from './../../lib/elastic'

const jwa = require('jwa');
const hmac = jwa('HS256');

const getProxy = (req, config) => {
  const platform = config.platform
  const factory = new PlatformFactory(config, req)
  return factory.getAdapter(platform, 'product')
};

/**
 * GET get products info
 */
export const listProducts = (config) => async (req, res) => {
  const productProxy = getProxy(req, config)

  if (!req.query.skus) return apiStatus(res, 'skus parameter is required', 500)

  try {
    const result = await productProxy.list(req.query.skus.split(','))
    apiStatus(res, result, 200);
  } catch (err) {
    apiError(res, err);
  }
}

/**
 * GET get products info
 */
export const renderListProducts = (config) => async (req, res) => {
  const productProxy = getProxy(req, config)

  if (!req.query.skus) return apiStatus(res, 'skus parameter is required', 500)

  const skuList = req.query.skus.split(',')
  const storeId = (req.query.storeId && parseInt(req.query.storeId) > 0) ? req.query.storeId : 1
  try {
    const result = await productProxy.renderList(skuList, req.query.currencyCode, storeId)
    result.items = result.items.map((item) => {
      let sgnObj = item
      if (config.tax.calculateServerSide === true) {
        sgnObj = { priceInclTax: item.price_info.final_price }
      } else {
        sgnObj = { price: item.price_info.extension_attributes.tax_adjustments.final_price }
      }

      item.sgn = hmac.sign(sgnSrc(sgnObj, item), config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
      return item
    })
    apiStatus(res, result, 200);
  } catch (err) {
    apiError(res, err);
  }
}

export const queryProducts = (config) =>
  async ({
    filter,
    sort = '',
    currentPage = 1,
    pageSize = 200,
    search = ''
  }, {
      indexName = '',
      _sourceInclude = null,
      _sourceExclude = null
    }) => {
    const query = buildQuery({ filter, sort, currentPage, pageSize, search, type: 'product' })
    const esQuery = adjustQuery({
      index: indexName,
      body: query,
      _sourceInclude,
      _sourceExclude
    }, 'product', config)

    const esResponse = await getElasticClient(config).search(esQuery)

    return getHits(esResponse)
  }
