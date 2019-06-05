class AbstractWishlistProxy {
  pull (customerToken) {
    throw new Error('AbstractWishlistProxy::pull must be implemented for specific platform')
  }
  update (customerToken, wishListItem) {
    throw new Error('AbstractWishlistProxy::update must be implemented for specific platform')
  }
  delete (customerToken, wishListItem) {
    throw new Error('AbstractWishlistProxy::delete must be implemented for specific platform')
  }
}

module.exports = AbstractWishlistProxy
