import ImageCache from '../abstract'
import fs from 'fs-extra'
import { createHash } from 'crypto'

export default class FileImageCache extends ImageCache {

  async getImageFromCache() {
    this.image = await fs.readFile(
      `${this.config.imageable.caching.file.path}/${this.path}`
    )
  }

  async save() {
    await fs.outputFile(
      `${this.config.imageable.caching.file.path}/${this.path}`,
      this.image
    )
  }

  async check() {
    return await fs.pathExists(`${this.config.imageable.caching.file.path}/${this.path}`)
  }

  get path(): string {
    return `${this.key.substring(0, 2)}/${this.key.substring(2, 4)}/${this.key}`
  }

  createKey(): string {
    console.log(createHash('md5').update(this.req.url).digest('hex'))
    return createHash('md5').update(this.req.url).digest('hex')
  }

  isValidFor(type) {
    return type === 'file'
  }
}
