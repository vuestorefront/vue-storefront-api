import camelCase from 'lodash/camelCase'

export const objectKeysToCamelCase = (object: Record<string, any>) => {
  for (let key in object) {
    const ccKey = camelCase(key)
    if (ccKey !== key) {
      object[ccKey] = object[key]
      delete object[key]
    }
  }

  return object
}
