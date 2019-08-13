import ImageCache from '../abstract'
import fs from 'fs-extra'
import { createHash } from 'crypto'

export default class FileImageCache extends ImageCache {
  public async getImageFromCache () {
    this.image = await fs.readFile(
      `${this.config.imageable.caching.file.path}/${this.path}`
    )
  }

  public async save () {
    await fs.outputFile(
      `${this.config.imageable.caching.file.path}/${this.path}`,
      this.image
    )
  }

  public async check () {
    const response = await fs.pathExists(`${this.config.imageable.caching.file.path}/${this.path}`)
    return response
  }

  private get path (): string {
    return `${this.key.substring(0, 2)}/${this.key.substring(2, 4)}/${this.key}`
  }

  public createKey (): string {
    console.log(createHash('md5').update(this.req.url).digest('hex'))
    return createHash('md5').update(this.req.url).digest('hex')
  }

  public isValidFor (type) {
    return type === 'file'
  }
}
