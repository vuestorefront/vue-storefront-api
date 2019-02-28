function isNumeric(val) {
  return Number(parseFloat(val)).toString() === val;
}

module.exports = function (restClient) {
  let module = {};
  const urlPrefix = 'cart/';
  let url = urlPrefix;
  function getResponse(data){
    if(data.code === 200){
      return data.result;
    }
    return false;
  }
  module.create = (customerToken) => {
    url += `create?token=${customerToken}`;
    return restClient.post(url).then((data)=> {
      return getResponse(data);
    });
  }
  module.update = (customerToken, cartId, cartItem) => {
    url += `update?token=${customerToken}&cartId=${cartId}`;
    return restClient.post(url, { cartItem: cartItem }).then((data)=> {
      return getResponse(data);
    });
  }
  module.applyCoupon = (customerToken, cartId, coupon) => {
    url += `applyCoupon?token=${customerToken}&cartId=${cartId}&coupon=${coupon}`;
    return restClient.post(url).then((data)=> {
      return getResponse(data);
    });
  }
  module.deleteCoupon = (customerToken, cartId) => {
    url += `deleteCoupon?token=${customerToken}&cartId=${cartId}`;
    return restClient.post(url).then((data)=> {
      return getResponse(data);
    });
  }
  module.delete = (customerToken, cartId, cartItem) => {
    url += `delete?token=${customerToken}&cartId=${cartId}`;
    return restClient.post(url, { cartItem: cartItem }).then((data)=> {
      return getResponse(data);
    });
  }
  module.pull = (customerToken, cartId) => {
    url += `pull?token=${customerToken}&cartId=${cartId}`;
    return restClient.get(url).then((data)=> {
      return getResponse(data);
    });
  }
  module.totals = (customerToken, cartId) => {
    url += `totals?token=${customerToken}&cartId=${cartId}`;
    return restClient.get(url).then((data)=> {
      return getResponse(data);
    });
  }
  module.shippingInformation = (customerToken, cartId, body) => {
    url += `totals?token=${customerToken}&cartId=${cartId}`;
    return restClient.post(url, body).then((data)=> {
      return getResponse(data);
    });
  }
  module.shippingMethods = (customerToken, cartId, address) => {
    url += `shippingMethods?token=${customerToken}&cartId=${cartId}`;
    return restClient.post(url, { address: address }).then((data)=> {
      return getResponse(data);
    });
  }
  module.paymentMethods = (customerToken, cartId) => {
    url += `paymentMethods?token=${customerToken}&cartId=${cartId}`;
    return restClient.get(url).then((data)=> {
      return getResponse(data);
    });
  }
  module.getCoupon = (customerToken, cartId) => {
    url += `coupon?token=${customerToken}&cartId=${cartId}`;
    return restClient.get(url).then((data)=> {
      return getResponse(data);
    });
  }
  return module;
}
