let request = require('request');
let RequestHandler = require('./imageable/lib/request-handler');

 
export default ({ config, db }) => function (req, res, body) {

  // Image proxy for products
  if (!(req.method == 'GET')) {
    throw new Error('ERROR: ' + req.method + ' request method is not supported.')

  }

  // if we want to get by product sku or name only
  /**
  const elasticsearch = require('elasticsearch');
  const client = new elasticsearch.Client({
    host: config.esHost,
    log: 'trace'
  });
  */

  let urlParts = req.url.split('/');

  if(urlParts.length < 4)
    throw new Error('Please provide following parameters: /img/<width>/<height>/<action:crop,fit,resize,identify>/<relative_url>');

  const imgUrl = config.magento2.imgUrl + '/' + urlParts.slice(4).join('/')//.split('/'); // full original image url

  let rh = new RequestHandler(config.imageable, {
    before: function (stats) {},
    after: function (stats, returnValueOfBefore, err) { }
  });

  let width = parseInt(urlParts[1]);
  let height = parseInt(urlParts[2]);
  let action = urlParts[3];


 console.log(imgUrl + ' / ' + action + '/' + width + '/' + height);
  req.query.size = width + 'x' + height;
  req.query.url = imgUrl;
  req.originalUrl = '/'+ (action ? action : 'fit') + '?url=' + encodeURIComponent(imgUrl) + '&size=' + width + 'x' + height;
  console.log(req.originalUrl );
  req.url = req.originalUrl;
  
  return rh.handle(req, res)

  
  

}
