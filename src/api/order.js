import resource from 'resource-router-middleware';

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'order',

	/** For requests with an `id`, you can auto-load the entity.
	 *  Errors terminate the request, success sets `req[id] = data`.
	 */
	load(req, id, callback) {
	
	},

	/** GET / - Search products */
	index({ params }, res) {
		res.json({});
	},



	/** GET /:id - Return a given entity */
	read({ facet }, res) {
		res.json({});
	},

	
});
