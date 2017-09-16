var crypto = require('crypto')
  , fs     = require('fs')
  , exec   = require('child_process').exec

var Utils = module.exports = function(config) {
  this.config = config
}

Utils.prototype.hash = function(s) {
  return crypto.createHash('md5').update(s + this.config.secret).digest("hex").slice(0,8)
}

Utils.prototype.hashMatches = function(hash, data){
  var doesMatch = false

  doesMatch = doesMatch || (this.config.magicHash == hash)
  doesMatch = doesMatch || (this.config.secret.toString().length == 0)
  doesMatch = doesMatch || (this.hash(data) == hash)

  return doesMatch
}

Utils.prototype.deleteFile = function(path) {
  try {
    fs.unlinkSync(path)
  } catch(e) { }
}

Utils.prototype.exec = exec
