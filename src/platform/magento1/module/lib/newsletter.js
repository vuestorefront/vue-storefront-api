module.exports = function (restClient) {
  let module = {};
  const urlPrefix = 'newsletter/';
  let url = urlPrefix;
  function getResponse(data){
    if(data.code === 200){
      return data.result;
    }
    return false;
  }
  module.subscribe = (emailAddress) => {
    url += `subscribe`;
    return restClient.post(url, {emailAddress: emailAddress}).then((data)=> {
      return getResponse(data);
    });
  };
  module.unsubscribe = (customerToken) => {
    url += `unsubscribe?token=${customerToken}`;
    return restClient.post(url).then((data)=> {
      return getResponse(data);
    });
  };
  return module;
};
