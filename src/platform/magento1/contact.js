import AbstractContactProxy from '../abstract/contact';
import { multiStoreConfig } from './util';

class ContactProxy extends AbstractContactProxy {
  constructor (config, req) {
    const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  submit (form) {
    return this.api.contact.submit(form);
  }
}

module.exports = ContactProxy;
