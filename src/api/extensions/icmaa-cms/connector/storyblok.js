import * as config from 'config'
import StoryblokClient from 'storyblok-js-client'
import { objectKeysToCamelCase } from '../helpers/formatter'
import { sortBy } from 'lodash';

class StoryblokConnector {

  api() {
    return new StoryblokClient({
      accessToken: config.extensions.icmaaCms.storyblok.accessToken,
      cache: {
        clear: 'auto',
        type: 'memory'
      }
    })
  }

  matchLanguage(lang) {
    lang = lang ? lang.toLowerCase() : false
    const defaultLang = config.extensions.icmaaCms.storyblok.defaultLanguage.toLowerCase()
    this.lang = !lang || lang === defaultLang ? false : lang
    
    return this.lang
  }

  async fetch(type, uid, lang) {
    try {
      this.matchLanguage(lang)
      return this.api().get('cdn/stories', {
        "starts_with": this.lang ? `${this.lang}/*` : "",
        "filter_query": {
          "component": { "in": type },
          "identifier": { "in": uid },
        }
      })
      .then(response => {
        let { content } = response.data.stories.shift() || { content: {} }
        objectKeysToCamelCase(content)
        return content
      }).catch(error => {
        console.log(error)
      })
    } catch (error) {
      return error
    }
  }

  createAttributeOptionArray(options, nameKey = 'label', valueKey = 'value', sortKey = 'sort_order') {
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
