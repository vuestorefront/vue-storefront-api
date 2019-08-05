import ImageCache from '../abstract'
import { createHash } from 'crypto'
import { Bucket, Storage } from '@google-cloud/storage'
export default class GoogleCloudStorageImageCache extends ImageCache {
  private static storage: Storage
  private static bucket: Bucket

  public constructor (config, req) {
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

  public get bucketName (): string {
    return this.moduleConfig.bucket
  }

  public get moduleConfig (): any {
    return this.config.imageable.caching[`google-cloud-storage`]
  }

  public async getImageFromCache () {
    const donwload = await GoogleCloudStorageImageCache.bucket.file('testing/cache/image/' + this.key).download()
    this.image = donwload[0]
  }

  public async save () {
    await GoogleCloudStorageImageCache.bucket.file('testing/cache/image/' + this.key).save(this.image, {
      gzip: true
    })
  }

  public async check () {
    const response = await GoogleCloudStorageImageCache.bucket.file('testing/cache/image/' + this.key).exists()
    return response[0]
  }

  public createKey (): string {
    return createHash('md5').update(this.req.url).digest('hex')
  }

  public isValidFor (type) {
    return type === 'google-cloud-storage'
  }
}
