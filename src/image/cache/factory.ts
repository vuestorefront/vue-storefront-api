'use strict'

import { Request } from 'express'
import { IConfig } from 'config'
import ImageCache, { Cache } from './abstract'

export default class CacheFactory {
  private request: Request
  private config: IConfig

  public constructor (app_config: IConfig, req: Request) {
    this.config = app_config
    this.request = req
  }

  public getAdapter (type: string, ...constructorParams): any {
    let AdapterClass: Cache = require(`./${type}`).default
    if (!AdapterClass) {
      throw new Error(`Invalid adapter ${type}`)
    } else {
      const adapterInstance: ImageCache = new AdapterClass(this.config, this.request)
      if ((typeof adapterInstance.isValidFor === 'function') && !adapterInstance.isValidFor(type)) { throw new Error(`Not valid adapter class or adapter is not valid for ${type}`) }
      return adapterInstance
    }
  }
}

export {
  CacheFactory
}
