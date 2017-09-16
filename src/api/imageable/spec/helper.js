var exec = require('child_process').exec

module.exports = {
  images: {
    google: "http://www.google.de/images/logos/ps_logo2.png",
    french: "http://blog-fr.dawanda.com/wp-content/uploads/2012/01/Capture-d’écran-2012-01-19-à-11.27.07.png",
    big:    "http://s31.dawandastatic.com/PressReleaseItem/0/818/1264780823-785.jpg",
    local:  __dirname + "/fixtures/test.jpg"
  },

  testTmpRoot: __dirname + "/tmp",

  clearTmpFolder: function() {
    exec('rm -rf ' + this.testTmpRoot + "/*")
  }
}
