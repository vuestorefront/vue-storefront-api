import sharp from 'sharp';
import rp from 'request-promise-native';

export async function downloadImage (url) {
  return await rp.get(url, { encoding: null });
}

export async function identify (buffer) {
  try {
    const transformer = sharp(buffer);

    return transformer.metadata();
  } catch (err) {
    console.log(err);
  }
} 

export async function resize (buffer, width, height) {
  try {
    const transformer = sharp(buffer);

    if (width || height) {
      transformer.resize(width, height).max().withoutEnlargement();
    }

    return transformer.toBuffer();
  } catch (err) {
    console.log(err);
  }
}

export async function fit (buffer, width, height) {
  try {
    const transformer = sharp(buffer);

    if (width || height) {
      transformer.resize(width, height).crop();
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