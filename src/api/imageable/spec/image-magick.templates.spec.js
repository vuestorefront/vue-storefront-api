var buster      = require('buster')
  , ImageMagick = require(__dirname + '/../lib/image-magick.js')
  , Helper      = require(__dirname + '/helper.js')
  , exec        = require('child_process').exec

buster.spec.expose()
buster.testRunner.timeout = 10000

describe('ImageMagick.Templates', function() {
  before(function() {
    this.checkForInvalidity = function(value) {
      expect(function() {
        ImageMagick.Templates.checkValue(value)
      }).toThrow()
    }

    this.checkForValidity = function(value) {
      expect(function() {
        ImageMagick.Templates.checkValue(value)
      }).not.toThrow()
    }
  })

  describe('checkValue', function() {
    it("doesn't allow semicolons", function() {
      this.checkForInvalidity('foo;bar')
    })

    it("doesn't allow single or double quotes", function() {
      this.checkForInvalidity('"')
      this.checkForInvalidity("'")
    })

    it("allows normal urls", function() {
      this.checkForValidity('http://blog.dawanda.com/wp-content/uploads/2012/01/354x264_c_0548c68b981.jpg')
    })

    it("allows french urls", function() {
      this.checkForValidity('http://blog.dawanda.com/wp-content/uploads/2012/01/àçèá.jpg')
      this.checkForValidity('http://blog-fr.dawanda.com/wp-content/uploads/2012/01/Capture-d’écran-2012-01-19-à-11.27.07.png')
    })

    it("allows queries", function() {
      this.checkForValidity('http://s31.dawandastatic.com/Product/22564/22564177/1315733897-155.jpg?20110911090949')
    })

    it("allows local paths", function() {
      this.checkForValidity('/tmp/node-image-magick/1328090704763/4453')
    })

    it("allows dimensions", function() {
      this.checkForValidity('40x20')
      this.checkForValidity('950>x200>')
      this.checkForValidity('1576x1182+0+0')
    })

    it("allows numbers", function() {
      this.checkForValidity('1328090785983')
    })

    it("allows filenames", function() {
      this.checkForValidity('2763.jpeg')
    })
  })

  describe('get', function() {
    it('throws error if evil commands characters are detected', function() {
      expect(function() {
        ImageMagick.Templates.get('resizeCmd', {size: '300x200"; rm -rf /'})
      }).toThrow()
    })

    it("doesn't throw an error if no evil characters are detected", function() {
      expect(function() {
        ImageMagick.Templates.get('resizeCmd', { size: '300x200' })
      }).not.toThrow()
    })
  })
})
