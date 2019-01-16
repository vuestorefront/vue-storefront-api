import { Router } from 'express';
import {apiStatus} from "../../../lib/util";
import { filterReturnContent } from './features/customFilters';
import { exists } from 'fs';
import { searchAndFetchFromPrismic } from './features/prismicConnection';
import constStrings from './features/constStrings';
const elasticConnection = require('./features/elasticConnection');

module.exports = ({ config }) => {

  let cmsApi = Router();

  //listen to webhooks
  cmsApi.post('/webhook', (req, res) =>{
    if(req.body.root.secret === config.prismic.webhook.secretKey && config.prismic.useElasticSearchLayer) {
      if(req.body.root.type === 'api-update'){
        searchAndFetchFromPrismic(null, req).then( result => {
          let prismicRes = result.results;
          if(prismicRes.length > 0){
            elasticConnection.saveToElasticSearch(prismicRes);
            return apiStatus(res, true, 200);
          }
        }).catch(err => {
          throw new Error(constStrings.prismicFetchErrorThrow + err);
        })
      }
    }
    return apiStatus(res, false, 500);
  });

  cmsApi.get('/index', (req, res) => {
    let query;
    if (req.query.id){
      query = { "_id": req.query.id };
    }
    else if (req.query.type) {
      query = {"prismic_type": req.query.type};
    }
    else if (req.query.tag) {
      query = {"prismic_tags": req.query.tag};
    }

    if (!query) {
      throw new Error(constStrings.elasticErrorThrow + 'No search data provided');
    }
    config.prismic.useElasticSearchLayer = false
    if(config.prismic.useElasticSearchLayer){
      elasticConnection.elasticSearchClient().search({
        index: elasticConnection.elasticSearchIndex(req.query.index_name),
        type: 'prismic',
        body: {
          query: {
            match: query
          },
        }
      },(error, response) => {
        if (error){
          throw new Error(constStrings.elasticErrorThrow + error);
        }
        if (response.hits.total === 0) { // need to get it from Prismic and save it to Elastic Search
          searchAndFetchFromPrismic(query, req)
            .then( result => {
              let prismicRes = result.results;
              if(prismicRes.length > 0){
                elasticConnection.saveToElasticSearch(prismicRes);
                return apiStatus(res, filterReturnContent(prismicRes[0].data, req.query.filter, req.query.filter_option), 200);
              }
              return apiStatus(res, 'No data with given properties in Prismic repo', 500);
            }).catch((err) => {
            throw new Error(constStrings.prismicFetchErrorThrow + err);
          })
        } else {
          return apiStatus(
            res,
            filterReturnContent(response.hits.hits, req.query.filter, req.query.filter_option),
            200);
        }
      });
    } else {
      searchAndFetchFromPrismic(query, req).then( prismicRes => {
        if(prismicRes.results.length > 0){
          return apiStatus(res, filterReturnContent(prismicRes.results, req.query.filter, req.query.filter_option), 200);
        }
        return apiStatus(res, 'No data with given properties in Prismic repo', 500);
      }).catch((err) => {
        throw new Error(constStrings.prismicFetchErrorThrow + err);
      })
    }
  });

  return cmsApi;
}
