'use strict';

import { Request } from 'express';
import { IConfig } from 'config';

class PlatformFactory {
  private request: Request
  private config: IConfig

  public constructor (app_config: IConfig, req: Request|null = null) {
    this.config = app_config;
    this.request = req
  }

  public getAdapter (platform: string, type: string, ...constructorParams): any {
    let AdapterClass = require(`./${platform}/${type}`);
    if (!AdapterClass) {
      throw new Error(`Invalid adapter ${platform} / ${type}`);
    } else {
      let adapter_instance = new AdapterClass(this.config, this.request, ...constructorParams);
      if ((typeof adapter_instance.isValidFor === 'function') && !adapter_instance.isValidFor(type)) { throw new Error(`Not valid adapter class or adapter is not valid for ${type}`); }
      return adapter_instance;
    }
  }
}

export default PlatformFactory;
