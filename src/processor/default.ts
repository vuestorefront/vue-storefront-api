import { Request, Response } from "express";
import { IConfig } from "config";
const jwa = require('jwa');
const hmac = jwa('HS256');

class HmacProcessor {

  _config: IConfig
  _entityType: any
  _indexName: any
  _req: Request
  _res: Response

  constructor(config: IConfig, entityType: any, indexName: any, req: Request, res: Response){
    this._config = config
    this._entityType = entityType
    this._indexName = indexName
    this._req = req
    this._res = res
  }

  process (items) {
    console.debug('Entering HmacProcessor::process')

    const processorChain = []

    return new Promise((resolve, reject) => {
      const rs = items.map((item) => {
        if (this._req.query._source_exclude && this._req.query._source_exclude.indexOf('sgn') < 0) {
          item._source.sgn = hmac.sign(item._source, this._config.get('objHashSecret')); // for products we sign off only price and id becase only such data is getting back with orders
        }
        return item
      })

        // return first resultSet
        resolve(rs)
    })
  }
}

module.exports = HmacProcessor
