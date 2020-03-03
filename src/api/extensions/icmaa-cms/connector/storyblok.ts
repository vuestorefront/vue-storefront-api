import config from 'config'

import qs from 'qs'
import { get as http2get } from 'http2-client'
import zlib from 'zlib'

import { objectKeysToCamelCase } from '../helpers/formatter'
import { extractStoryContent, extractPluginValues } from '../helpers/formatter/storyblok'
import { sortBy, pick, merge } from 'lodash'

class StoryblokConnector {
  protected lang

  public api () {
    return {
      get: (endpoint: string = 'cdn/stories', params: Record<string, any>): Promise<any> => {
        const baseUrl = 'https://api.storyblok.com/v1'
        const querystring: string = '?' + qs.stringify(
          merge({ token: config.get('extensions.icmaaCms.storyblok.accessToken') }, params),
          { encodeValuesOnly: true, arrayFormat: 'brackets' }
        )

        return new Promise((resolve) => {
          let data = ''
          http2get(
            `${baseUrl}/${endpoint}${querystring}`,
            { headers: { 'Accept-Encoding': 'gzip, deflate', 'Cache-Control': 'no-cache' } },
            response => {
              // Storyblok is using gzip on its request, so it isn't complete without uncompressing it.
              // The following block minds about the decompression using `zlib` of node.
              // We could do this much simpler using `request`, `axios` or `fetch` but they won't support HTTP2.
              var output
              if (response.headers['content-encoding'] === 'gzip') {
                var gzip = zlib.createGunzip()
                response.pipe(gzip)
                output = gzip
              } else {
                output = response
              }

              output
                .on('data', chunk => { data += chunk })
                .on('end', () => {
                  resolve(JSON.parse(data))
                })
            })
        })
      }
    }
  }

  public matchLanguage (lang) {
    lang = lang && lang !== 'default' ? lang.toLowerCase() : false
    this.lang = lang && config.get('icmaa.mandant') ? `${config.get('icmaa.mandant')}_${lang}` : lang
    return this.lang
  }

  public isJsonString (string) {
    try {
      return JSON.parse(string)
    } catch (e) {
      return false
    }
  }

  public async fetch ({ type, uid, lang }) {
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
          const story = response.stories.shift() || { }
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

  public async search ({ type, q, lang, fields }) {
    let queryObject = { 'identifier': { 'in': q } }
    if (this.isJsonString(q)) {
      queryObject = this.isJsonString(q)
    }

    try {
      this.matchLanguage(lang)
      return this.searchRequest({ queryObject, type, page: 1, fields })
    } catch (error) {
      return error
    }
  }

  public async searchRequest ({ queryObject, type, page = 1, results = [], fields }) {
    return this.api().get('cdn/stories', {
      'page': page,
      'per_page': 100,
      'starts_with': this.lang ? `${this.lang}/*` : '',
      'filter_query': {
        'component': { 'in': type },
        ...queryObject
      }
    }).then(response => {
      let stories = response.stories
        .map(story => extractStoryContent(story))
        .map(story => objectKeysToCamelCase(story))
        .map(story => extractPluginValues(story))

      if (fields && fields.length > 0) {
        stories = stories.map(story => pick(story, fields.split(',')))
      }

      results = [].concat(results, stories)
      if (stories.length < 100) {
        return results
      }

      return this.searchRequest({ queryObject, type, page: page + 1, results, fields })
    }).catch(error => {
      console.log(error)
    })
  }

  public createAttributeOptionArray (options, nameKey: string|Function = 'label', valueKey: string = 'value', sortKey: string|boolean = 'sort_order') {
    let result = []
    options.forEach(option => {
      result.push({
        'name': typeof nameKey === 'function' ? nameKey(option) : option[nameKey],
        'value': option[valueKey],
        'sort_order': sortKey !== false ? option[sortKey as string] : 1
      })
    })

    result = sortBy(result, ['sort_order', 'name'])

    return result
  }
}

export default new StoryblokConnector()
