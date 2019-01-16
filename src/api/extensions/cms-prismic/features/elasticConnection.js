const elasticsearch = require('elasticsearch');
import constStrings from './constStrings';
import config from 'config';

const elasticSearchIndex = (indexName) => {
  if (!indexName) {
    if (config.elasticsearch.indices[0]) {
      return config.elasticsearch.indices[0];
    }
    throw new Error(constStrings.elasticErrorThrow + 'No default elastic search index name in config');
  } else {
    if (config.elasticsearch.indices.indexOf(indexName) < 0) {
      throw new Error(constStrings.elasticErrorThrow + 'Invalid / inaccessible index name given.');
    }
    return indexName;
  }
}

const elasticSearchClient = () => {
  if (config.elasticsearch.user && config.elasticsearch.password && config.elasticsearch.host && config.elasticsearch.port) {
    const client = new elasticsearch.Client( {
      host: [
        `http://${config.elasticsearch.user}:${config.elasticsearch.password}@${config.elasticsearch.host}:${config.elasticsearch.port}/`
      ]
    });
    client.cluster.health({},function(err,resp) {
      if (!resp) {
        throw new Error(constStrings.elasticErrorThrow + 'No connection to elastic search.');
      }
    });
    return client;
  } else {
    throw new Error(constStrings.elasticErrorThrow + 'No / insufficient login data for elastic search in config.');
  }
}

const saveToElasticSearch = (prismicData) => {
  for (let element of prismicData) {
    elasticSearchClient().index({
      index: elasticSearchIndex(),
      id: element.id,
      type: 'prismic',
      body: {
        "prismic_type": element.type,
        "prismic_tags": JSON.stringify(element.tags),
        "content": JSON.stringify(element.data)
      }
    },(err) => {
      if(err) {
        throw new Error(constStrings.elasticErrorThrow + err);
      }
    });
  }
};

export { elasticSearchIndex, elasticSearchClient, saveToElasticSearch };
