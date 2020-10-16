import sharp from 'sharp';
import rp from 'request-promise-native';
import config from 'config';

sharp.cache(config.imageable.cache);
sharp.concurrency(config.imageable.concurrency);
sharp.counters(config.imageable.counters);
sharp.simd(config.imageable.simd);

export async function downloadImage (url) {
  const response = await rp.get(url, { encoding: null });
  return response
}

export async function identify (buffer, imageFormat) {
  try {
    const transformer = sharp(buffer);

    if (imageFormat) {
      return transformer.toFormat(imageFormat).toBuffer();
    }

    return transformer.metadata();
  } catch (err) {
    console.log(err);
  }
}

export async function resize (buffer, width, height, imageFormat) {
  try {
    const transformer = sharp(buffer);

    if (width || height) {
      const options = {
        withoutEnlargement: true,
        fit: sharp.fit.inside
      }
      transformer.resize(width, height, options)
    }

    if (imageFormat) {
      return transformer.toFormat(imageFormat).toBuffer();
    }

    return transformer.toBuffer();
  } catch (err) {
    console.log(err);
  }
}

export async function fit (buffer, width, height, imageFormat) {
  try {
    const transformer = sharp(buffer);

    if (width || height) {
      transformer.resize(width, height, { fit: sharp.fit.cover });
    }

    if (imageFormat) {
      return transformer.toFormat(imageFormat).toBuffer();
    }

    return transformer.toBuffer();
  } catch (err) {
    console.log(err);
  }
}

export async function crop (buffer, width, height, x, y) {
  try {
    const transformer = sharp(buffer);

    if (width || height || x || y) {
      transformer.extract({ left: x, top: y, width, height });
    }

    return transformer.toBuffer();
  } catch (err) {
    console.log(err);
  }
}
