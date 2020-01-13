import { version } from '../../package.json';
import { Router } from 'express';
import order from './order';
import catalog from './catalog';
import user from './user';
import stock from './stock';
import review from './review';
import cart from './cart';
import product from './product';
import sync from './sync';
import url from './url';

export default ({ config, db }) => {
  let api = Router();

  // mount the catalog resource
  api.use('/catalog', catalog({ config, db }))

  // mount the order resource
  api.use('/order', order({ config, db }));

  // mount the user resource
  api.use('/user', user({ config, db }));

  // mount the stock resource
  api.use('/stock', stock({ config, db }));

  // mount the review resource
  api.use('/review', review({ config, db }));

  // mount the cart resource
  api.use('/cart', cart({ config, db }));

  // mount the product resource
  api.use('/product', product({ config, db }))

  // mount the sync resource
  api.use('/sync', sync({ config, db }))

  // mount the url resource
  api.use('/url', url({ config }))

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json({ version });
  });

  /** Register the custom extensions */
  for (let ext of config.registeredExtensions) {
    let entryPoint

    try {
      entryPoint = require('./extensions/' + ext)
    } catch (err) {
      try {
        entryPoint = require(ext)
      } catch (err) {
        console.error(err)
      }
    }

    if (entryPoint) {
      api.use('/ext/' + ext, entryPoint({ config, db }))
      console.log('Extension ' + ext + ' registered under /ext/' + ext + ' base URL')
    }
  }

  return api;
}
