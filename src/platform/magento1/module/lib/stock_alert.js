module.exports = function (restClient) {
  let module = {};
  const urlPrefix = 'stockalert/';
  let url = urlPrefix;
  function getResponse(data){
    if (data.code === 200){
      return data.result;
    }

    return false;
  }
  module.subscribe = (customerToken, productId, emailAddress) => {
    url += `add`;

    if (typeof customerToken !== 'undefined' && customerToken) {
      url += `?token=${customerToken}`
    }

    let alertData = {
      productId: productId
    }

    if (emailAddress) {
      alertData.emailAddress = emailAddress
    }

    return restClient.post(url, alertData).then((data)=> {
      return getResponse(data);
    });
  };
  return module;
};
