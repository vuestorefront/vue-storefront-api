import config from 'config';
import elasticsearch from '@elastic/elasticsearch';

const client = new elasticsearch.Client({
  node: `${config.elasticsearch.protocol}://${config.elasticsearch.host}:${config.elasticsearch.port}`
});

export default client;
