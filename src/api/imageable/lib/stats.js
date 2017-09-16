var exec = require('child_process').exec

var Stats = module.exports = function(config) {
  this.config     = config || {}
  this.data       = null
  this.reportedAt = null

  this.reset()
}

Stats.prototype.record = function(time) {
  this.data.requests.push(time)
}

Stats.prototype.format = function() {
  return {
    count: this.data.requests.length,
    avg:   (this.data.requests.length > 0) ? (this.data.requests.reduce(function(a,b){ return a + b }, 0) / this.data.requests.length) : 0
  }
}

Stats.prototype.reset = function() {
  this.reportedAt = Date.now()
  this.data = {
    requests: []
  }
}

Stats.prototype.reportNeeded = function() {
  var interval = (this.config.interval || 10) * 1000

  return (this.config && ((Date.now() - this.reportedAt) > interval))
}

Stats.prototype.report = function(callback) {
  var self = this
    , data = this.format()

  ;(this.config.commands || []).forEach(function(cmd) {
    for(var key in data) {
      cmd = cmd.replace("%{" + key + "}", data[key])
    }

    exec(cmd, function(err, stdout, stderr) {
      if(err) console.log(err)
      else console.log('successfully sent command (' + cmd + ')')

      callback && callback()
    })
  })
}
