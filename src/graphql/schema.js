import path from 'path';
import config from 'config';
import { fileLoader, mergeTypes } from 'merge-graphql-schemas';

const typesArray = fileLoader(
  path.join(__dirname, `./${config.server.searchEngine}/*/*.graphqls`)
);

export default mergeTypes(typesArray, { all: true });
