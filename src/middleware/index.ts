import { Router } from 'express';
import { json } from 'body-parser';
import { NextHandleFunction } from 'connect';
import { IConfig } from 'config';

export default ({ config, db }: { config: IConfig, db: CallableFunction }): [ NextHandleFunction, Router ] => {
  let routes: Router = Router();
  let bp: NextHandleFunction = json();
  return [ bp, routes ];
}
