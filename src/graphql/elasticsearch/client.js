import config from 'config';
import elasticsearch from 'elasticsearch';

const client = new elasticsearch.Client({
  host: {
    host: config.elasticsearch.host,
    port: config.elasticsearch.port,
    protocol: config.elasticsearch.protocol
  },
});

export default client;
