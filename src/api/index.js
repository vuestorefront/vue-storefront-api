import { version } from '../../package.json';
import { Router } from 'express';
import order from './order';
import img from './img';
import catalog from './catalog'
import user from './user'
import stock from './stock'
import cart from './cart'
import product from './product'
import sync from './sync'

export default ({ config, db }) => {
	let api = Router();

	// mount the catalog resource
	api.use('/catalog', catalog({ config, db }) )

	// mount the order resource
	api.use('/order', order({ config, db }));
	
	// mount the user resource
	api.use('/user', user({ config, db }));

	// mount the stock resource
	api.use('/stock', stock({ config, db }));

	// mount the cart resource
	api.use('/cart', cart({ config, db }));
	
	// mount the product resource
	api.use('/product', product({ config, db }))

	// mount the sync resource
	api.use('/sync', sync({ config, db }))

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	/** Register the custom extensions */
	for(let ext of config.registeredExtensions) {

		try {
			let entryPoint = require('./extensions/' + ext)	
			if (entryPoint) {
				api.use('/ext/' + ext, entryPoint({ config, db }))
				console.log('Extension ' + ext + ' registered under /ext/' + ext +' base URL')
			}
		} catch (err) {
			console.error(err)
		}
	}

	return api;
}
