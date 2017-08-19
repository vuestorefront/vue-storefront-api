import { version } from '../../package.json';
import { Router } from 'express';
import product from './product';
import catalog from './catalog'

export default ({ config, db }) => {
	let api = Router();

	// mount the catalog resource
	api.use('/product', product({ config, db }));
	api.use('/catalog', catalog({ config, db }) )

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
