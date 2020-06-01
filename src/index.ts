import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import { loadAdditionalCertificates } from './helpers/loadAdditionalCertificates'
import api from './api';
import config from 'config';
import img from './api/img';
import invalidateCache from './api/invalidate'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './graphql/resolvers';
import typeDefs from './graphql/schema';
import * as path from 'path'

const app = express();

// logger
app.use(morgan('dev'));

app.use('/media', express.static(path.join(__dirname, config.get(`${config.get('platform')}.assetPath`))))

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.get('corsHeaders')
}));

app.use(bodyParser.json({
  limit: config.get('bodyLimit')
}));

loadAdditionalCertificates()

// connect to db
initializeDb(db => {
  // internal middleware
  app.use(middleware({ config, db }));

  // api router
  app.use('/api', api({ config, db }));
  app.use('/img', img({ config, db }));
  app.use('/img/:width/:height/:action/:image', (req, res, next) => {
    console.log(req.params)
  });
  app.post('/invalidate', invalidateCache)
  app.get('/invalidate', invalidateCache)

  const port = process.env.PORT || config.get('server.port')
  const host = process.env.HOST || config.get('server.host')
  app.listen(parseInt(port), host, () => {
    console.log(`Vue Storefront API started at http://${host}:${port}`);
  });
});

// graphQl Server part
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/graphql', graphqlExpress(req => ({
  schema,
  context: { req: req },
  rootValue: global
})));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.use((err, req, res, next) => {
  const { statusCode = 500, message = '', stack = '' } = err;
  const stackTrace = stack
    .split(/\r?\n/)
    .map(string => string.trim())
    .filter(string => string !== '')

  res.status(statusCode).json({
    code: statusCode,
    result: message,
    ...(config.get('server.showErrorStack') ? { stack: stackTrace } : {})
  });
});

export default app;
