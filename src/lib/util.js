import config from 'config';
import crypto from 'crypto';
const algorithm = 'aes-256-ctr';

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

export function sgnSrc (sgnObj, item) {
	if (config.tax.alwaysSyncPlatformPricesOver) {
		sgnObj.id = item.id 
	} else {
		sgnObj.sku = item.sku
	}
	// console.log(sgnObj)
	return sgnObj
}

/**	Creates a api status call and sends it thru to Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [code=200]		Status code to send on success
 *	@param {json} [result='OK']		Text message or result information object
 */
export function apiStatus(res, result = 'OK', code = 200, meta = null) {
	let apiResult = { code: code, result: result };
	if (meta !== null) {
		apiResult.meta = meta;
	}
	res.status(code).json(apiResult);
	return result;
}

export function encryptToken(textToken, secret) {
	const cipher = crypto.createCipher(algorithm, secret)
	let crypted = cipher.update(textToken, 'utf8',  'hex')
	crypted += cipher.final('hex');
	return crypted;
}

export function decryptToken(textToken, secret) {
	const decipher = crypto.createDecipher(algorithm, secret)
	let dec = decipher.update(textToken, 'hex', 'utf8')
	dec += decipher.final('utf8');
	return dec;	
}