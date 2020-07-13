import ImageAction from '../abstract'
import mime from 'mime-types'
import { downloadImage, fit, identify, resize } from '../../../lib/image'

export default class LocalImageAction extends ImageAction {
  public imageOptions
  public SUPPORTED_MIMETYPES = ['image/gif', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  public imageBuffer: Buffer

  public get whitelistDomain (): string[] {
    return this.options.imageable.whitelist
  }

  public get maxAgeForResponse () {
    return 365.25 * 86400
  }

  public getImageURL (): string {
    return this.imageOptions.imgUrl
  }

  public getOption () {
    let imgUrl: string
    let width: number
    let height: number
    let action: string
    if (this.req.query.url) { // url provided as the query param
      imgUrl = decodeURIComponent(this.req.query.url as string)
      width = parseInt(this.req.query.width as string)
      height = parseInt(this.req.query.height as string)
      action = this.req.query.action as string
    } else {
      let urlParts = this.req.url.split('/')
      width = parseInt(urlParts[1])
      height = parseInt(urlParts[2])
      action = urlParts[3]
      imgUrl = `${this.options[this.options.platform].imgUrl}/${urlParts.slice(4).join('/')}` // full original image url
      if (urlParts.length < 5) {
        this.res.status(400).send({
          code: 400,
          result: 'Please provide following parameters: /img/<type>/<width>/<height>/<action:fit,resize,identify>/<relative_url>'
        })
        this.next()
      }
    }

    this.imageOptions = {
      imgUrl,
      width,
      height,
      action
    }
  }

  public validateOptions () {
    const { width, height, action } = this.imageOptions
    if (isNaN(width) || isNaN(height) || !this.SUPPORTED_ACTIONS.includes(action)) {
      return this.res.status(400).send({
        code: 400,
        result: 'Please provide following parameters: /img/<type>/<width>/<height>/<action:fit,resize,identify>/<relative_url> OR ?url=&width=&height=&action='
      })
    }

    if (width > this.options.imageable.imageSizeLimit || width < 0 || height > this.options.imageable.imageSizeLimit || height < 0) {
      return this.res.status(400).send({
        code: 400,
        result: `Width and height must have a value between 0 and ${this.options.imageable.imageSizeLimit}`
      })
    }
  }

  public validateMIMEType () {
    const mimeType = mime.lookup(this.imageOptions.imgUrl)

    if (mimeType === false || !this.SUPPORTED_MIMETYPES.includes(mimeType)) {
      return this.res.status(400).send({
        code: 400,
        result: 'Unsupported file type'
      })
    }

    this.mimeType = mimeType
  }

  public async prossesImage () {
    const { imgUrl } = this.imageOptions

    try {
      this.imageBuffer = await downloadImage(imgUrl)
    } catch (err) {
      return this.res.status(400).send({
        code: 400,
        result: `Unable to download the requested image ${imgUrl}`
      })
    }
    const { action, width, height } = this.imageOptions
    switch (action) {
      case 'resize':
        this.imageBuffer = await resize(this.imageBuffer, width, height)
        break
      case 'fit':
        this.imageBuffer = await fit(this.imageBuffer, width, height)
        break
      case 'identify':
        this.imageBuffer = await identify(this.imageBuffer)
        break
      default:
        throw new Error('Unknown action')
    }
  }
}
