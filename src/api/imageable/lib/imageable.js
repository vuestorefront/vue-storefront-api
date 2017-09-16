var RequestHandler = require("./request-handler")

var Imageable = module.exports = function(config, options) {
  var imageable = null

  return function(req, res, next) {
    imageable = imageable || new RequestHandler(config, options)
    try {
      imageable.handle(req, res, next)
    } catch(e) {
      e.url = "http://" + req.headers.host + req.url

      imageable.callAfterCallback(e, null, req)
      throw e
    }
  }
}

Imageable.Logger = require("./logger")
