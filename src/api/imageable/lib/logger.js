var Logger = module.exports = function(config) {
  this.config = config
}

Logger.formatDate = function(date) {
  var months        = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    , formattedDate = [date.getDate(), months[date.getMonth()]].map(function(num){ return num < 10 ? '0'+num : num }).join(" ")
    , formattedTime = [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()].map(function(num){ return num < 10 ? '0'+num : num }).join(":")

  return '[' + [formattedDate, formattedTime].join(" ") + ']'
}

Logger.prototype.log = function(s) {
  if(this.config && this.config.debug) {
    console.log(Logger.formatDate(new Date()) + ' ' + s)
  }
}
