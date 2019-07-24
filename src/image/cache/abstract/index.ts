import { Request } from 'express'

export default abstract class ImageCache {
  image: Buffer
  config
  req: Request
  key: string

  constructor(config, req) {
    this.config = config
    this.req = req
    this.key = this.createKey()
  }

  abstract getImageFromCache()

  abstract save()

  abstract check()

  abstract createKey(): string

  abstract isValidFor(type: string): boolean

}

interface Cache {
  image: Buffer
  config: any
  req: Request
  key: string
  new(config, req: Request)
  getImageFromCache(): void
  save(): void
  check(): void
  createKey(): string
  isValidFor(type: string): boolean
}

export {
  Cache,
  ImageCache
}
