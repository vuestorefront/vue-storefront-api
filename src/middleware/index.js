import { Router } from 'express';
import { json } from 'body-parser';

export default ({ config, db }) => {
	let routes = Router();
	let bp = json();
	return [ bp, routes ];
}
