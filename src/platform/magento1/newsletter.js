import AbstractNewsletterProxy from '../abstract/newsletter';
import { multiStoreConfig } from './util';
import { Magento1Client } from './module/index';

class NewsletterProxy extends AbstractNewsletterProxy {
  constructor (config, req){
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  subscribe (emailAddress) {
    return this.api.newsletter.subscribe(emailAddress);
  }
  unsubscribe (customerToken) {
    return this.api.newsletter.unsubscribe(customerToken);
  }
}

module.exports = NewsletterProxy;
