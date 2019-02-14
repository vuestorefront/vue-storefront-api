import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory'

export default ({ config, db }) => {

	let stockApi = Router();

	const _getProxy = (req) => {
		const platform = config.platform
		const factory = new PlatformFactory(config, req)
		return factory.getAdapter(platform,'stock')
	};

	/**
	 * GET get stock item
	 */
	stockApi.get('/check/:sku', (req, res) => {

		const stockProxy = _getProxy(req)

		if (!req.params.sku) {
			return apiStatus(res, 'sku parameter is required', 500);
		}

		// FIXME use stock from config
		//
		// Proposal: in "storeViews" node of config file add a node like this:
		//
		// "msi": {
		// 	"stockId": 2
		// },
		//
		// So that if the node is present it means that MSI is enabled and only if it is enabled we should call
		// the additional MSI APIs
		const stockId = 2;

		stockProxy.check(req.params.sku).then((result) => {
			return result;
		}).then((result) => {
			// TODO if MSI not enabled, don't call the following additional APIs but return apiStatus(res, result, 200)
			stockProxy.getSalableQty(req.params.sku, stockId ).then((salableQty) => {
				result.qty = salableQty;
				return result;
			}).then((result) => {
				stockProxy.isSalable(req.params.sku, stockId ).then((isSalable) => {
					result.is_in_stock = isSalable;
					apiStatus(res, result, 200);
				})
			})
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})

	/**
	 * GET get stock item - 2nd version with the query url parameter
	 *
	 * FIXME avoid code replication - see above method
	 */
	stockApi.get('/check/:sku', (req, res) => {

		const stockProxy = _getProxy(req)

		if (!req.query.sku) {
			return apiStatus(res, 'sku parameter is required', 500);
		}

		// FIXME use stock from config
		//
		// Proposal: in "storeViews" node of config file add a node like this:
		//
		// "msi": {
		// 	"stockId": 2
		// },
		//
		// So that if the node is present it means that MSI is enabled and only if it is enabled we should call
		// the additional MSI APIs
		const stockId = 2;

		stockProxy.check(req.params.sku).then((result) => {
			return result;
		}).then((result) => {
			// TODO if MSI not enabled, don't call the following additional APIs but return apiStatus(res, result, 200)
			stockProxy.getSalableQty(req.params.sku, stockId ).then((salableQty) => {
				result.qty = salableQty;
				return result;
			}).then((result) => {
				stockProxy.isSalable(req.params.sku, stockId ).then((isSalable) => {
					result.is_in_stock = isSalable;
					apiStatus(res, result, 200);
				})
			})
		}).catch(err=> {
			apiStatus(res, err, 500);
		})
	})

	/**
	 * GET get stock item list by skus (comma separated)
	 */
	stockApi.get('/list', (req, res) => {

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

	return stockApi
}
