import { NextFunction, Request, Response } from 'express'
import URL from 'url'

export default abstract class ImageAction {
  public readonly SUPPORTED_ACTIONS = ['fit', 'resize', 'identify']
  public readonly SUPPORTED_MIMETYPES

  public req: Request
  public res: Response
  public next: NextFunction
  public options
  public mimeType: string

  public constructor (req: Request, res: Response, next: NextFunction, options) {
    this.req = req
    this.res = res
    this.next = next
    this.options = options
  }

  abstract getOption(): void

  abstract validateOptions(): void

  abstract getImageURL(): string

  abstract get whitelistDomain(): string[]

  abstract validateMIMEType(): void

  abstract prossesImage(): void

  public isImageSourceHostAllowed () {
    if (!this._isUrlWhitelisted(this.getImageURL(), 'allowedHosts', true, this.whitelistDomain)) {
      return this.res.status(400).send({
        code: 400,
        result: `Host is not allowed`
      })
    }
  }

  public _isUrlWhitelisted (url, whitelistType, defaultValue, whitelist) {
    if (arguments.length !== 4) throw new Error('params are not optional!')

    if (whitelist && whitelist.hasOwnProperty(whitelistType)) {
      const requestedHost = URL.parse(url).host

      const matches = whitelist[whitelistType].map(allowedHost => {
        allowedHost = allowedHost instanceof RegExp ? allowedHost : new RegExp(allowedHost)
        return !!requestedHost.match(allowedHost)
      })
      return matches.indexOf(true) > -1
    } else {
      return defaultValue
    }
  }
}
