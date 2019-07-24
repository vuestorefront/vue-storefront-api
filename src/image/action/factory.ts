'use strict';

import { NextFunction, Request, Response } from 'express'
import { IConfig } from "config";

export default class ActionFactory {

  request: Request
  next: NextFunction
  response: Response
  config: IConfig

  constructor(req: Request, res, next, app_config) {
    this.request = req
    this.response = res
    this.next = next
    this.config = app_config;
  }

  getAdapter(type: String): any {
    let adapter_class = require(`./${type}`).default
    if (!adapter_class) {
      throw new Error(`Invalid adapter ${type}`);
    } else {
      let adapter_instance = new adapter_class(this.request, this.response, this.next, this.config);
      if((typeof adapter_instance.isValidFor == 'function') && !adapter_instance.isValidFor(type))
        throw new Error(`Not valid adapter class or adapter is not valid for ${type}`);
      return adapter_instance;
    }
  }
}

export {
  ActionFactory
};
