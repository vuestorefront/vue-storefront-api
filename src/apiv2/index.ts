import { Router } from 'express';
import catalog from './catalog';
import cart from './cart';

export default ({ config, db }) => {
  let api = Router();

  // mount the catalog resource
  api.use('/catalog', catalog({ config, db }))

  // mount the cart resource
  api.use('/cart', cart({ config, db }));

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
