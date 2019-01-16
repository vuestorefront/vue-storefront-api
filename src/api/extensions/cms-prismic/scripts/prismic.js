const config = require('config');
const program = require('commander');
const Prismic = require('prismic-javascript');
const elasticsearch = require('elasticsearch');

const elasticSearchClient = () => {
  if (config.elasticsearch.user && config.elasticsearch.password && config.elasticsearch.host && config.elasticsearch.port) {
    const client = new elasticsearch.Client( {
      host: [
        `http://${config.elasticsearch.user}:${config.elasticsearch.password}@${config.elasticsearch.host}:${config.elasticsearch.port}/`
      ]
    });
    client.cluster.health({},function(err,resp) {
      if (!resp) {
        console.log('No connection to elastic search.')
      }
    });
    return client;
  } else {
    console.log('No / insufficient login data for elastic search in config.')
  }
}


const saveToElasticSearch = (prismicData, index) => {
  for (let element of prismicData) {
    elasticSearchClient().index({
      index: index,
      id: element.id,
      type: 'prismic',
      body: {
        "prismic_type": element.type,
        "prismic_tags": JSON.stringify(element.tags),
        "content": JSON.stringify(element.data)
      }
    },(err) => {
      if(err) {
        console.log('Elastic Search indexing failed: ' + err);
      }
    });
  }
};

program
  .command('fetch')
  .option('--index <index>', 'name of index', config.elasticsearch.indices[0])
  .action((cmd) => {
    Prismic.getApi(config.prismic.apiEndpoint, {req: null}).then(function (api) {
      api.query('').then(function (result) {
        let prismicRes = result.results;
        if(prismicRes.length > 0){
          saveToElasticSearch(prismicRes, cmd.index);
          console.log('Fetch and save successfully');
        }
      });
    });
  })
program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason)
})

process.on('uncaughtException', function(exception) {
  console.log(exception)
})
