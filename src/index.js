import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import config from 'config';
import img from './api/img';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './graphql/resolvers';
import typeDefs from './graphql/schema';
import swagger from 'express-swagger-generator';

let app = express();

const expressSwagger = swagger(app);

let options = {
  swaggerDefinition: {
    info: {
      description: 'This is a sample server',
      title: 'Swagger',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    basePath: '/api',
    produces: [
      "application/json",
      "application/xml"
    ],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: "",
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: ['./api/**/*.js'] //Path to the API handle folder
};
expressSwagger(options);

app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

app.use('/media', express.static(__dirname + config[config.platform].assetPath))

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.corsHeaders,
}));

app.use(bodyParser.json({
  limit : config.bodyLimit
}));

// connect to db
initializeDb( db => {
  // internal middleware
  app.use(middleware({ config, db }));

  // api router
  app.use('/api', api({ config, db }));
  app.use('/img', img({ config, db }));

  const port = process.env.PORT || config.server.port
  const host = process.env.HOST || config.server.host
  app.server.listen(port, host, () => {
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

export default app;
