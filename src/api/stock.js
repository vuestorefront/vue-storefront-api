import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory'

export default ({ config, db }) => {

	let api = Router();

	const _getProxy = (req) => {
		const platform = config.platform
		const factory = new PlatformFactory(config, req)
		return factory.getAdapter(platform, 'stock')
	};

	const _getStoreView = (storeId) => {
		const filtered = config.availableStores.map((store) => {
			return config.storeViews[store]
		}).filter((store) => {
			return store.storeId === parseInt(storeId)
		})
		return filtered[0]
	};

	/**
	 * GET get stock item - 2nd version with the query url parameter
	 */
	api.get('/check', (req, res) => {

		const stockProxy = _getProxy(req)

		if (!req.query.sku) {
			return apiStatus(res, 'sku parameter is required', 500);
		}

		stockProxy.check(req.query.sku).then((result) => {
			return result;
		}).then((result) => {
			if (config.storeViews.multiSourceInventory) {
				if (!req.query.storeId) {
					return apiStatus(res, 'storeId parameter is required', 500);
				}
				const storeView = _getStoreView(req.query.storeId)
				const stockId = storeView.msi.stockId

				stockProxy.getSalableQty(req.query.sku, stockId).then((salableQty) => {
					result.qty = salableQty;
					return result;
				}).then((result) => {
					stockProxy.isSalable(req.query.sku, stockId).then((isSalable) => {
						result.is_in_stock = isSalable;
						apiStatus(res, result, 200);
					})
				})
			} else {
				apiStatus(res, result, 200);
			}
		}).catch(err => {
			apiStatus(res, err, 500);
		})
	})

	/**
	 * GET get stock item list by skus (comma separated)
	 */
	api.get('/list', (req, res) => {

		const stockProxy = _getProxy(req)

		if (!req.query.skus)
			return apiStatus(res, 'skus parameter is required', 500);

		const skuArray = req.query.skus.split(',')
		const promisesList = []
		for (const sku of skuArray) {
			promisesList.push(stockProxy.check(sku))
		}
		Promise.all(promisesList).then((results) => {
			apiStatus(res, results, 200);
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})

	return api
}
