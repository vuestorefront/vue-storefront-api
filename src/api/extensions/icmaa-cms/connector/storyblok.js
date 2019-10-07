import config from 'config'
import StoryblokClient from 'storyblok-js-client'
import { objectKeysToCamelCase } from '../helpers/formatter'
import { extractPluginValues } from '../helpers/formatter/storyblok'
import { sortBy } from 'lodash'

class StoryblokConnector {
  api () {
    return new StoryblokClient({
      accessToken: config.extensions.icmaaCms.storyblok.accessToken,
      cache: {
        clear: 'auto',
        type: 'memory'
      }
    })
  }

  matchLanguage (lang) {
    lang = lang && lang !== 'default' ? lang.toLowerCase() : false
    this.lang = lang && config.icmaa.mandant ? `${config.icmaa.mandant}-${lang}` : lang
    return this.lang
  }

  isJsonString (string) {
    try {
      return JSON.parse(string)
    } catch (e) {
      return false
    }
  }

  async fetch (type, uid, lang) {
    try {
      this.matchLanguage(lang)
      return this.api().get('cdn/stories', {
        'starts_with': this.lang ? `${this.lang}/*` : '',
        'filter_query': {
          'component': { 'in': type },
          'identifier': { 'in': uid }
        }
      })
        .then(response => {
          let { content } = response.data.stories.shift() || { content: {} }
          objectKeysToCamelCase(content)
          extractPluginValues(content)
          return content
        }).catch(error => {
          console.log(error)
        })
    } catch (error) {
      return error
    }
  }

  async search (type, q, lang) {
    let queryObject = { 'identifier': { 'in': q } }
    if (this.isJsonString(q)) {
      queryObject = this.isJsonString(q)
    }

    try {
      this.matchLanguage(lang)
      return this.api().get('cdn/stories', {
        'starts_with': this.lang ? `${this.lang}/*` : '',
        'filter_query': {
          'component': { 'in': type },
          ...queryObject
        }
      }).then(response => {
        return response.data.stories
          .map(story => objectKeysToCamelCase(story.content))
          .map(story => extractPluginValues(story))
      }).catch(error => {
        console.log(error)
      })
    } catch (error) {
      return error
    }
  }

  createAttributeOptionArray (options, nameKey = 'label', valueKey = 'value', sortKey = 'sort_order') {
    let result = []
    options.forEach(option => {
      result.push({
        'name': typeof nameKey === 'function' ? nameKey(option) : option[nameKey],
        'value': option[valueKey],
        'sort_order': sortKey !== false ? option[sortKey] : 1
      })
    });

    result = sortBy(result, ['sort_order', 'name'])

    return result
  }
}

export default new StoryblokConnector()
