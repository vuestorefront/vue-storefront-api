// @ts-check
import CacheFactory from '../image/cache/factory';
import ActionFactory from '../image/action/factory';

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default ({ config, db }) =>
  asyncMiddleware(async (req, res, next) => {
    if (!(req.method === 'GET')) {
      res.set('Allow', 'GET');
      return res.status(405).send('Method Not Allowed');
    }
    const cacheFactory = new CacheFactory(config, req)

    req.socket.setMaxListeners(config.imageable.maxListeners || 50);

    let imageBuffer

    const actionFactory = new ActionFactory(req, res, next, config)
    const imageAction = actionFactory.getAdapter(config.imageable.action.type)
    imageAction.getOption()
    imageAction.validateOptions()
    imageAction.isImageSourceHostAllowed()
    imageAction.validateMIMEType()

    const cache = cacheFactory.getAdapter(config.imageable.caching.type)

    if (config.imageable.caching.active && await cache.check()) {
      await cache.getImageFromCache()
      imageBuffer = cache.image
    } else {
      await imageAction.prossesImage()

      if (config.imageable.caching.active) {
        cache.image = imageAction.imageBuffer
        await cache.save()
      }

      imageBuffer = imageAction.imageBuffer
    }

    if (res.headersSent) {
      return
    }

    return res
      .type(imageAction.mimeType)
      .set({ 'Cache-Control': `max-age=${imageAction.maxAgeForResponse}` })
      .send(imageBuffer);
  });
