import * as config from 'config'
import * as Prismic from 'prismic-javascript'

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
    
    let options = {
      lang: (lang === undefined || lang === 'all') ? '*' : lang
    }

    try {
      let api = await this.api();
      return await api.query(query, options)
        .then(response => response)
        .catch(error => error)
    } catch (error) {
      return error
    }
  }
}

export default new PrismicConnector()