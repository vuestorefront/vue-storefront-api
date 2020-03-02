import pick from 'lodash/pick'
import config from 'config'
import StoryblokClient from 'storyblok-js-client'

const pluginMap: Record<string, any>[] = config.get('extensions.icmaaCms.storyblok.pluginFieldMap')
const metaFieldsToTransport = [{'name': 'uname'}, 'uuid', 'published_at', 'created_at', 'first_published_at']

const getFieldMap = (key) => pluginMap.find(m => m.key === key)

export const extractPluginValues = (object) => {
  for (let key in object) {
    let v = object[key]
    if (typeof v === 'object') {
      if (v.plugin) {
        const map = getFieldMap(v.plugin)
        if (map) {
          const values = pick(v, map.values)
          object[key] = map.values.length === 1 ? Object.values(values)[0] : values
        }
      } else if (v.type === 'doc') {
        object[key] = new StoryblokClient({}).richTextResolver.render(object[key])
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
  metaFieldsToTransport.forEach((f) => {
    if (typeof f === 'object') {
      content[Object.values(f)[0]] = object[Object.keys(f)[0]]
    } else {
      content[f] = object[f]
    }
  })
  return content
}
