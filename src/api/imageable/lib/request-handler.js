var Utils       = require("./utils")
  , ImageMagick = require("./image-magick")
  , Logger      = require("./logger")
  , URL         = require("url")
  , oneYear     = 31557600000
  , fs          = require('fs')

var RequestHandler = module.exports = function(config, options) {
  this.config             = config || {}
  this.config.tmpPathRoot = this.config.tmpPathRoot || '/tmp/node-image-magick'

  this.options            = options || {}
  this.stats              = new RequestHandler.Stats(this.config.reporting)
  this.utils              = new Utils(this.config)
  this.logger             = new Logger(this.config)
}

RequestHandler.Stats = require("./stats")

// will get called via connect
RequestHandler.prototype.handle = function(req, res, next) {  
  req.socket.setMaxListeners(this.config.maxListeners || 50)

  var start            = Date.now()
    , beforeHookResult = null
    , self             = this

  this.logger.log('Received request')
  
  if (this.isImageProcessUrl(req) && this.isImageSourceHostAllowed(req)) {
    this.logger.log('Image processing request')
    console.log('pr');
    if(this.options.before) beforeHookResult = this.options.before(this.stats)

    this.processImage(req, res, function() {
      self.logger.log('Image processing done')
      self.stats.record(Date.now() - start)

      if(self.stats.reportNeeded()) {
        self.logger.log('Reporting stats')
        self.stats.report()
        self.stats.reset()
      }

      self.logger.log('Triggering after hook')
      self.logger.log('Request handling took ' + (Date.now() - start) + 'ms')
      self.callAfterCallback(null, beforeHookResult, req)
    })
  } else {
    this.logger.log("No image processing request")
    next && next()
  }
}

RequestHandler.prototype.processImage = function(req, res, callback) {
  var method = this.getImageProcessUrlMatch(req)[1]
    , self   = this

  this.logger.log("Starting image processing")

  if (this._isValidHash(req)) {
    var imageMagick = new ImageMagick(this.config, this.logger)

    this.logger.log('Hash is valid')

    imageMagick[method](req.query, function(err, result) {
      var afterMethodName = (method == 'identify') ? '_afterIdentify' : '_afterResize'

      self.logger.log('Finished image processing')
      self[afterMethodName](err, result, res, callback)
    })
  } else {
    this.logger.log('Hash is invalid')
    res.send("Hash mismatch")
  }
}

RequestHandler.prototype.deleteTempfile = function(paths) {
  if(!Array.isArray(paths)) {
    paths = [paths]
  }

  this.utils.exec('rm ' + paths.join(' '))
}

// request checks

RequestHandler.prototype.isImageSourceHostAllowed = function(req) {
  return this._isUrlWhitelisted(req.query.url, 'allowedHosts', true)
}

RequestHandler.prototype.isImageSourceHostTrusted = function(req) {
  return this._isUrlWhitelisted(req.query.url, 'trustedHosts', false)
}

RequestHandler.prototype.isImageProcessUrl = function(req) {
  return !!this.getImageProcessUrlMatch(req)
}

RequestHandler.prototype.getImageProcessUrlRegExp = function() {
  var template = "^\/(identify|resize|crop|fit)(\/([^\/\?]+))?"

  if (this.config.hasOwnProperty('namespace') && (this.config.namespace != ''))
    template = template.replace("^", "^\/" + this.config.namespace)

  return new RegExp(template)
}

RequestHandler.prototype.getImageProcessUrlMatch = function(req) { 
  var urlRegExp = this.getImageProcessUrlRegExp()
  return req.originalUrl.match(urlRegExp)
}

RequestHandler.prototype.callAfterCallback = function(err, beforeHookResult, req) {
  this.options.after && this.options.after(this.stats, beforeHookResult, err, req)
}

RequestHandler.prototype.checkDownloadCacheSize = function(callback) {
  this._getTempFolderSize(function(size) {
    if(size > this.config.maxDownloadCacheSize) {
      this._deleteOldDownloads(callback)
    } else {
      callback && callback()
    }
  }.bind(this))
}

// private

RequestHandler.prototype._isUrlWhitelisted = function(url, whitelistType, defaultValue) {
  if(arguments.length != 3) throw new Error('params are not optional!')

  if(this.config && this.config.whitelist && this.config.whitelist.hasOwnProperty(whitelistType)) {
    var requestedHost = URL.parse(url).host
      , matches       = this.config.whitelist[whitelistType].map(function(allowedHost) {
                          allowedHost = ((allowedHost instanceof RegExp) ? allowedHost : new RegExp(allowedHost))
                          return !!requestedHost.match(allowedHost)
                        })

    return (matches.indexOf(true) > -1)
  } else {
    return defaultValue
  }
}

RequestHandler.prototype._afterResize = function(err, path, res, callback) {
  var self = this

  if (err) {
    this.logger.log('Image processing failed')
    res.send(500)
  } else {
    this.logger.log('Sending processed image')

    res.contentType(path.replace(/\?(.*)/, ""))
    res.sendFile(path, { maxAge: oneYear }, function() {
      self.logger.log('File sent')

      if(!self.config.keepDownloads) {
        self.deleteTempfile(path)
      } else if(self.config.maxDownloadCacheSize) {
        self.checkDownloadCacheSize()
      }

      callback && callback()
    })
  }
}

RequestHandler.prototype._afterIdentify = function(err, content, res, callback) {
  if(err) {
    this.logger.log('Identify failed')
    res.send(500) 
  } else {
    this.logger.log('Identify succeeded')
    res.send(content);//, callback)
  }
}

RequestHandler.prototype._isValidHash = function(req) {
  var hash   = this.getImageProcessUrlMatch(req)[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]

  return (this.isImageSourceHostTrusted(req) || this.utils.hashMatches(hash, query))
}

RequestHandler.prototype._deleteOldDownloads = function(callback) {
  this._getOldTempFiles(function(files) {
    this.logger.log('deleting tmp files: ' + files.join(', '))
    this.deleteTempfile(files)

    if (callback) {
      callback()
    }
  }.bind(this))
}

RequestHandler.prototype._getTempFolderSize = function(callback) {
  this.utils.exec('du -csk ' + this.config.tmpPathRoot, function(err, stdout, stderr) {
    var dirSize = stdout.match(/(\d+)/)[1]

    if (callback) {
      dirSize = ~~(dirSize / 1024)
      this.logger.log('tmp folder size: ' + dirSize)
      callback(dirSize)
    }
  }.bind(this))
}

RequestHandler.prototype._getOldTempFiles = function (callback) {
  this.utils.exec('find ' + this.config.tmpPathRoot + ' -type f', function(err, stdout, stderr) {
    var paths  = stdout.split('\n').filter(function(line) { return line !== '' })
      , files  = []
      , result = []

    paths.forEach(function(path) {
      try {
        files.push({
          path: path,
          stats: fs.statSync(path)
        })
      } catch(e) {
        this.logger.log('statsSync failed for ' + path)
      }
    }.bind(this))

    files = files.sort(function(a, b) {
      if (a.stats.mtime < b.stats.mtime) {
       return -1
      } else if (a.stats.mtime > b.stats.mtime) {
         return 1
      } else {
        return 0
      }
    })

    while(result.length < ~~(files.length / 5)) {
      result.push(files[result.length].path)
    }

    callback && callback(result)
  }.bind(this))

}
