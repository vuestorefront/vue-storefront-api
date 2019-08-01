import * as config from 'config'
import StoryblokClient from 'storyblok-js-client'
import { objectKeysToCamelCase } from '../helpers/formatter'

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
    lang = lang.toLowerCase()
    const defaultLang = config.extensions.icmaaCms.storyblok.defaultLanguage.toLowerCase()
    this.lang = lang === defaultLang ? false : lang
    
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
}

export default new StoryblokConnector()
