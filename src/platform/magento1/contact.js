import AbstractContactProxy from '../abstract/contact';
import { multiStoreConfig } from './util';
import { Magento1Client } from './module/index';

class ContactProxy extends AbstractContactProxy {
  constructor (config, req){
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  submit (form) {
    return this.api.contact.submit(form);
  }
}

module.exports = ContactProxy;
