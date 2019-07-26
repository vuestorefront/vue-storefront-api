import ImageCache from '../abstract'
import { createHash } from 'crypto'
import { Bucket, Storage } from '@google-cloud/storage'
export default class GoogleCloudStorageImageCache extends ImageCache {

  static storage: Storage
  static bucket: Bucket

  constructor(config, req) {
    super(config, req)
    if (GoogleCloudStorageImageCache.storage === undefined) {
      GoogleCloudStorageImageCache.storage = new Storage(
        this.moduleConfig.libraryOptions
      )
    }
    if (GoogleCloudStorageImageCache.bucket === undefined) {
      GoogleCloudStorageImageCache.bucket = GoogleCloudStorageImageCache.storage.bucket(this.bucketName)
    }

  }

  get bucketName (): string {
    return this.moduleConfig.bucket
  }

  get moduleConfig (): any {
    return this.config.imageable.caching[`google-cloud-storage`]
  }

  async getImageFromCache() {
    const donwload = await GoogleCloudStorageImageCache.bucket.file('testing/cache/image/' + this.key).download()
    this.image = donwload[0]
  }

  async save() {
    await GoogleCloudStorageImageCache.bucket.file('testing/cache/image/' + this.key).save(this.image, {
      gzip: true
    })
  }

  async check() {
    const response = await GoogleCloudStorageImageCache.bucket.file('testing/cache/image/' + this.key).exists()
    return response[0]
  }

  createKey(): string {
    console.log(createHash('md5').update(this.req.url).digest('hex'))
    return createHash('md5').update(this.req.url).digest('hex')
  }

  isValidFor(type) {
    return type === 'google-cloud-storage'
  }
}
