import pick from 'lodash/pick'
import config from 'config'

const pluginMap = config.extensions.icmaaCms.storyblok.pluginFieldMap
const metaFieldsToTransport = ['uuid', 'published_at', 'created_at', 'first_published_at']

const getFieldMap = (key) => pluginMap.find(m => m.key === key)

export const extractPluginValues = (object) => {
  for (let key in object) {
    let v = object[key]
    if (typeof v === 'object' && v.plugin) {
      const map = getFieldMap(v.plugin)
      if (map) {
        const values = pick(v, map.values)
        object[key] = map.values.length === 1 ? Object.values(values)[0] : values
      }
    }
  }

  return object
}

export const extractStoryContent = (object) => {
  if (Object.values(object).length === 0) {
    return {}
  }

  let content = object.content
  metaFieldsToTransport.forEach(f => { content[f] = object[f] })
  return content
}
