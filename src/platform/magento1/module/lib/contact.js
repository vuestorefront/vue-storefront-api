module.exports = function (restClient) {
  let module = {};
  const urlPrefix = 'contact/';
  let url = urlPrefix;
  function getResponse(data){
    if(data.code === 200){
      return data.result;
    }
    return false;
  }
  module.submit = (form) => {
    url += `submit`;
    return restClient.post(url, {form}).then((data)=> {
      return getResponse(data);
    });
  };
  return module;
};
