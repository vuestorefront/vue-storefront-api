const config = require('config')

let numCPUs = require('os').cpus().length;

const CommandRouter = require('command-router');
const cli = CommandRouter();


cli.option({
    name: 'partitions',
    default: numCPUs,
    type: Number
});

cli.command('buildcache', () => {
    const soap = require('soap')
    const elasticsearch = require('elasticsearch');
    const esConfig = {
        host: {
          host: config.elasticsearch.host,
          port: config.elasticsearch.port
        },
        log: 'debug',
        apiVersion: config.elasticsearch.apiVersion,
        requestTimeout: 1000 * 60 * 60,
        keepAlive: false
      }
      if (config.elasticsearch.user) {
        esConfig.httpAuth = config.elasticsearch.user + ':' +  config.elasticsearch.password
      }
    const esClient = new elasticsearch.Client(esConfig);


    esClient.indices.exists({index: 'gls_parcelshop_dk'}, (err, resp, status) => {
        if (!resp) {
            esClient.indices.create({
                index: 'gls_parcelshop_dk'
            }, function (err, resp, status) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("create", resp);
                }
            });
        }
        else {
            console.log('Index gls_parcelshop_dk, already exists')
        }
    })

    let url = 'http://www.gls.dk/webservices_v2/wsPakkeshop.asmx?wsdl'
    let bulk = []

    soap.createClient(url, function (err, client) {
        client.GetAllParcelShops({}, function (err, result) {
            if (result.GetAllParcelShopsResult) {


                for (let i = 0; i < result.GetAllParcelShopsResult.PakkeshopData.length; i++) {
                    let droppoint = result.GetAllParcelShopsResult.PakkeshopData[i]

                    bulk.push(
                        {
                            index: {
                                _index: 'gls_parcelshop_dk',
                                _type: 'droppoint',
                                _id: droppoint.Number
                            }
                        }
                    )
                    bulk.push(droppoint)
                }
            }

            esClient.deleteByQuery({
                index: 'gls_parcelshop_dk',
                type: 'droppoint'
            }, function (err, resp, status) {
                console.log(resp);

                esClient.bulk({
                    body: bulk
                }, function (err, resp, status) {
                    console.log(resp);
                })
            })
        })
    })
});


cli.parse(process.argv);
