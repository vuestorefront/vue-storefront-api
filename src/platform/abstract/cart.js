class AbstractCartProxy {
  /**
   *
   * @param {*} customerToken
   *
   * @returns {
   *            "code": 200,
   *            "result": "a7b8e47aef108a8d0731c368a603a9af" <-- cart id
   *          }
   */
  create (customerToken) {
  }

  update (customerToken, cartId, cartItem) {
  }

  applyCoupon (customerToken, cartId, coupon) {
  }

  deleteCoupon (customerToken, cartId) {
  }

  getCoupon (customerToken, cartId) {
  }

  delete (customerToken, cartId, cartItem) {
  }

  pull (customerToken, cartId, params) {
  }

  totals (customerToken, cartId, params) {
  }
}

module.exports = AbstractCartProxy
