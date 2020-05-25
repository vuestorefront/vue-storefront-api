import resource from 'resource-router-middleware';
import { apiStatus, apiError } from '../lib/util';
import { merge } from 'lodash';
import PlatformFactory from '../platform/factory';

const Ajv = require('ajv'); // json validator
const fs = require('fs');
const path = require('path');
const kue = require('kue');
const jwa = require('jwa');
const hmac = jwa('HS256');

const _getProxy = (req, config) => {
  const platform = config.platform
  const factory = new PlatformFactory(config, req)
  return factory.getAdapter(platform, 'order')
};

export default ({ config, db }) => resource({

  /** Property name to store preloaded entity on `request`. */
  id: 'order',

  /**
   * POST create an order with JSON payload compliant with models/order.md
   */
  create (req, res) {
    const ajv = new Ajv();
    require('ajv-keywords')(ajv, 'regexp');

    const orderSchema = require('../models/order.schema.js')
    let orderSchemaExtension = {}
    if (fs.existsSync(path.resolve(__dirname, '../models/order.schema.extension.json'))) {
      orderSchemaExtension = require('../models/order.schema.extension.json')
    }
    const validate = ajv.compile(merge(orderSchema, orderSchemaExtension));

    if (!validate(req.body)) { // schema validation of upcoming order
      console.dir(validate.errors);
      apiStatus(res, validate.errors, 400);
      return;
    }
    const incomingOrder = { title: 'Incoming order received on ' + new Date() + ' / ' + req.ip, ip: req.ip, agent: req.headers['user-agent'], receivedAt: new Date(), order: req.body }/* parsed using bodyParser.json middleware */
    console.log(JSON.stringify(incomingOrder))

    for (let product of req.body.products) {
      let key: { id?: string, sku?: string, priceInclTax?: number, price?: number } = config.tax.calculateServerSide ? { priceInclTax: product.priceInclTax } : { price: product.price }
      if (config.tax.alwaysSyncPlatformPricesOver) {
        key.id = product.id
      } else {
        key.sku = product.sku
      }
      // console.log(key)

      if (!config.tax.usePlatformTotals) {
        if (!hmac.verify(key, product.sgn, config.objHashSecret)) {
          console.error('Invalid hash for ' + product.sku + ': ' + product.sgn)
          apiStatus(res, 'Invalid signature validation of ' + product.sku, 200);
          return;
        }
      }
    }

    if (config.orders.useServerQueue) {
      try {
        let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }));
        const job = queue.create('order', incomingOrder).save((err) => {
          if (err) {
            console.error(err)
            apiError(res, err);
          } else {
            apiStatus(res, job.id, 200);
          }
        })
      } catch (e) {
        apiStatus(res, e, 500);
      }
    } else {
      const orderProxy = _getProxy(req, config)
      orderProxy.create(req.body).then((result) => {
        apiStatus(res, result, 200);
      }).catch(err => {
        apiError(res, err);
      })
    }
  }
});
