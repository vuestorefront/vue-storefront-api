import * as config from 'config'
import * as Prismic from 'prismic-javascript'
import PrismicDOM from 'prismic-dom';
import { objectKeysToCamelCase } from '../helpers/formatter'

class PrismicConnector {

  async api() {
    return await Prismic.getApi(
      config.extensions.icmaaCms.prismic.apiEndpoint,
      { accessToken: config.extensions.icmaaCms.prismic.apiToken }
    )
  }

  async fetch(type, uid, lang) {
    let query = [ Prismic.Predicates.at('document.type', type) ]
    if (uid !== undefined) {
      query.push( Prismic.Predicates.at('my.' + type + '.uid', uid) )
    }
    
    try {
      let api = await this.api();
      return await api.query(query, { lang: '*' })
        .then(response => {
          let result = false
          
          if (lang !== undefined) {
            result = response.results.find(result => result.lang === lang)
          }

          if (!result) {
            result = response.results.find(result => result.lang === config.extensions.icmaaCms.prismic.fallbackLanguage)
          }

          let data = result.data || {}
          objectKeysToCamelCase(data)

          for (let key in data) {
            if (data[key] && typeof data[key] === 'object') {
              data[key] = PrismicDOM.RichText.asHtml(data[key])
            }
          }

          return data
         })
        .catch(error => error)
    } catch (error) {
      return error
    }
  }
}

export default new PrismicConnector()
