import config from 'config'
export function getCurrentPlatformConfig () {
  const currentPlatform: string = config.get('platform')
  return config.get(currentPlatform)
}
