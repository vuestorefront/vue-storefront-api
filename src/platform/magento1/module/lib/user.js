module.exports = function (restClient) {
  let module = {};
  let url = 'user/';
  function getResponse(data){
    if (data.code === 200){
      return data.result;
    }

    return false;
  }
  module.login = (userData) => {
    url += 'login';
    return restClient.post(url, userData).then((data)=> {
      return getResponse(data);
    });
  }
  module.resetPassword = function (emailData) {
    url += `resetPassword`;
    return restClient.post(url, {email: emailData.email}).then((data)=> {
      return getResponse(data);
    });
  }
  module.changePassword = function (passwordData) {
    url += `changePassword?token=${passwordData.token}`;
    return restClient.post(url, passwordData.body).then((data)=> {
      return getResponse(data);
    });
  }
  module.create = function (userData) {
    url += `create`;
    return restClient.post(url, userData).then((data)=> {
      return getResponse(data);
    });
  }
  module.creditValue = function (customerToken) {
    const getCreditUrl = `user_credit/get?token=${customerToken}`

    return restClient.get(getCreditUrl).then((data)=> {
      return getResponse(data);
    });
  }
  module.refillCredit = function (customerToken, creditCode) {
    const getCreditUrl = `user_credit/refill?token=${customerToken}`

    return restClient.post(getCreditUrl, {credit_code: creditCode}).then((data)=> {
      return getResponse(data);
    });
  }
  module.orderHistory = function (customerToken, page, pageSize) {
    url += `orderHistory?token=${customerToken}`;
    return restClient.get(url, {page: page, pageSize: pageSize}).then((data)=> {
      return getResponse(data);
    });
  }
  module.update = function (userData) {
    url += `me?token=${userData.token}`
    return restClient.post(url, userData.body).then((data)=> {
      return getResponse(data);
    });
  }
  module.me = function (customerToken) {
    const url = `user/me?token=${customerToken}`
    return restClient.get(url).then((data)=> {
      return getResponse(data);
    });
  }
  return module;
}
