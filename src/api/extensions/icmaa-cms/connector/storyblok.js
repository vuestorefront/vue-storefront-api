import config from 'config'
import StoryblokClient from 'storyblok-js-client'
import { objectKeysToCamelCase } from '../helpers/formatter'
import { extractStoryContent, extractPluginValues } from '../helpers/formatter/storyblok'
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
    this.lang = lang && config.icmaa.mandant ? `${config.icmaa.mandant}_${lang}` : lang
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
          const story = response.data.stories.shift() || { }
          const content = extractStoryContent(story)
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
      return this.searchRequest(queryObject, type, 1)
    } catch (error) {
      return error
    }
  }

  async searchRequest (queryObject, type, page = 1, results = []) {
    return this.api().get('cdn/stories', {
      'page': page,
      'per_page': 100,
      'starts_with': this.lang ? `${this.lang}/*` : '',
      'filter_query': {
        'component': { 'in': type },
        ...queryObject
      }
    }).then(response => {
      const stories = response.data.stories
        .map(story => extractStoryContent(story))
        .map(story => objectKeysToCamelCase(story))
        .map(story => extractPluginValues(story))

      results = results.concat(stories)
      if (stories.length < 100) {
        return results
      }

      return this.searchRequest(queryObject, type, page + 1, results)
    }).catch(error => {
      console.log(error)
    })
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
