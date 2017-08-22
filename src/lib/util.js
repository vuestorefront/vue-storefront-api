
/**	Creates a callback that proxies node callback style arguments to an Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [status=200]	Status code to send on success
 *
 *	@example
 *		list(req, res) {
 *			collection.find({}, toRes(res));
 *		}
 */
export function toRes(res, status=200) {
	return (err, thing) => {
		if (err) return res.status(500).send(err);

		if (thing && typeof thing.toObject==='function') {
			thing = thing.toObject();
		}
		res.status(status).json(thing);
	};
}



/**	Creates a api status call and sends it thru to Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [code=200]		Status code to send on success
 *	@param {json} [result='OK']		Text message or result information object
 */
export function apiStatus(res, result = 'OK', code = 200) {
	const apiResult = { code: code, result: result};
	res.status(code).json(apiResult);
	return result;
}
