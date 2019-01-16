import constStrings from './constStrings';
import config from 'config';
const Prismic = require('prismic-javascript');

export const searchAndFetchFromPrismic = async (query, req, noLimit = false) => {
  let documentType = 'id';
  let byValue;
  let orderings;
  let prismicQuery;
  if(!query){
    prismicQuery = '';
    if (noLimit) {
      orderings = null;
    } else {
      orderings = { pageSize : 3, orderings : '[document.last_publication_date desc]' }; // get only recent content
    }
  } else {
    if(query.hasOwnProperty('_id')){
      byValue = query._id
    }
    if (query.hasOwnProperty('prismic_type')) {
      documentType = 'type';
      byValue = query.prismic_type
    }
    if(query.hasOwnProperty('prismic_tags')){
      documentType = 'tags';
      byValue = [query.prismic_tags]
    }
    prismicQuery = Prismic.Predicates.at('document.' + documentType, byValue);
  }
  try {
    const api = await Prismic.getApi(config.prismic.apiEndpoint, { req: req });
    return await api.query(prismicQuery, orderings);
  }
  catch (err) {
    throw new Error(constStrings.prismicFetchErrorThrow + err);
  }
};
