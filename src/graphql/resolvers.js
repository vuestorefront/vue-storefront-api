import path from 'path';
import config from 'config';
import { fileLoader, mergeResolvers } from 'merge-graphql-schemas';

const resolversArray = fileLoader(
  path.join(__dirname, `./${config.server.searchEngine}/**/resolver.js`)
);

export default mergeResolvers(resolversArray, { all: true });
