module.exports = function (restClient) {
  let module = {};
  const urlPrefix = 'wishlist/';
  let url = urlPrefix;
  function getResponse(data){
    if(data.code === 200){
      return data.result;
    }
    return false;
  }
  module.pull = (customerToken) => {
    url += `pull?token=${customerToken}`;
    return restClient.get(url).then((data)=> {
      return getResponse(data);
    });
  };
  module.update = (customerToken, wishListItem) => {
    url += `update?token=${customerToken}`;
    return restClient.post(url, {wishListItem: wishListItem}).then((data)=> {
      return getResponse(data);
    });
  };
  module.delete = (customerToken, wishListItem) => {
    url += `delete?token=${customerToken}`;
    return restClient.post(url, {wishListItem: wishListItem}).then((data)=> {
      return getResponse(data);
    });
  };
  module.moveToCart = (customerToken, cartId, wishListItem) => {
    url += `moveToCart?token=${customerToken}&cartId=${cartId}`;
    return restClient.post(url, {wishListItem: wishListItem}).then((data)=> {
      return getResponse(data);
    });
  };
  return module;
};
