'use strict';

import { Request } from "express";
import { IConfig } from "config";

class PlatformFactory {

  request: Request
  config: IConfig

  constructor(app_config: IConfig, req: Request|null = null) {
    this.config = app_config;
    this.request = req
  }

  getAdapter(platform: String, type: String, ...constructorParams): any {
    let adapter_class = require(`./${platform}/${type}`);
    if (!adapter_class) {
      throw new Error(`Invalid adapter ${platform} / ${type}`);
    } else {
      let adapter_instance = new adapter_class(this.config, this.request, ...constructorParams);
      if((typeof adapter_instance.isValidFor == 'function') && !adapter_instance.isValidFor(type))
        throw new Error(`Not valid adapter class or adapter is not valid for ${type}`);
      return adapter_instance;
    }
  }
}

module.exports = PlatformFactory;
