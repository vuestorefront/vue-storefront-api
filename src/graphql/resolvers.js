import path from 'path';
import config from 'config';
import { fileLoader, mergeResolvers } from 'merge-graphql-schemas';

const coreResolvers = fileLoader(
  path.join(__dirname, `./${config.server.searchEngine}/**/resolver.js`)
);
const extensionsResolvers = fileLoader(
  path.join(__dirname, `../api/extensions/**/resolver.js`)
);
const resolversArray = coreResolvers.concat(extensionsResolvers)

export default mergeResolvers(resolversArray, { all: true });
