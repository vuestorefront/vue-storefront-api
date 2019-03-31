import config from 'config';
import elasticsearch from 'elasticsearch';


let port = config.elasticsearch.port
if (!port || port.length < 2) {
    port = ''
} else {
    port = `:${port}`
}
let host = `${config.elasticsearch.protocol}://${config.elasticsearch.host}${port}`

const client = new elasticsearch.Client({
  host
});

export default client;
