import AbstractWishlistProxy from '../abstract/wishlist';
import { multiStoreConfig } from './util';
import { Magento1Client } from './module/index';

class WishlistProxy extends AbstractWishlistProxy {
  constructor (config, req){
    super(config, req)
    this.api = Magento1Client(multiStoreConfig(config.magento1.api, req));
  }
  pull (customerToken) {
    return this.api.wishlist.pull(customerToken);
  }
  update (customerToken, wishListItem) {
    return this.api.wishlist.update(customerToken, wishListItem);
  }
  delete (customerToken, wishListItem) {
    return this.api.wishlist.delete(customerToken, wishListItem);
  }
}

module.exports = WishlistProxy;
