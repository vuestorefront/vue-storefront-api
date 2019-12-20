import config from 'config';
import es from '../../lib/elastic'

export default es.getClient(config)
