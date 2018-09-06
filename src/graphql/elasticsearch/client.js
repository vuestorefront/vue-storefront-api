import config from 'config';
import elasticsearch from 'elasticsearch';

const client = new elasticsearch.Client({
  hosts: [
    'http://' + config.elasticsearch.host + ':' + config.elasticsearch.port
  ]
});

export default client;
