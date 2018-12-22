const jwa = require('jwa');
const hmac = jwa('HS256');

class HmacProcessor {
  constructor(config, entityType, indexName, req, res){
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
          item._source.sgn = hmac.sign(item._source, this._config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
        }
        return item
      })

        // return first resultSet
        resolve(rs)
    })
  }
}

module.exports = HmacProcessor
