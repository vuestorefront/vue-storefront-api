var buster      = require('buster')
  , ImageMagick = require(__dirname + '/../lib/image-magick.js')
  , Helper      = require(__dirname + '/helper.js')
  , exec        = require('child_process').exec

buster.spec.expose()
buster.testRunner.timeout = 10000

describe('ImageMagick', function() {
  before(function() {
    this.imageMagick = new ImageMagick({ "tmpPathRoot": Helper.testTmpRoot })

    this.crop = function(options, callback) {
      this.imageMagick.crop(options, function(err, path) {
        exec("identify " + path, callback)
      })
    }.bind(this)

    this.resize = function(options, callback) {
      this.imageMagick.resize(options, function(err, path) {
        exec("identify " + path, callback)
      })
    }.bind(this)

    this.fit = function(options, callback) {
      this.imageMagick.fit(options, function(err, path) {
        exec("identify " + path, callback)
      })
    }.bind(this)

    this.moreDetailsPlease = function(smth) {
      exec('npm list buster|grep buster@', function(err, stdout, stderr) {
        if(stdout.indexOf('@0.7') !== -1) {
          throw Error('Please add a more detailed error message! We checked for ' + smth + ' before.')
        }
      })
    }

    Helper.clearTmpFolder()
  })

  after(function() {
    Helper.clearTmpFolder()
  })

  describe('resize', function() {
    describe('with local path', function() {
      it("resizes images when size is passed", function(done) {
        this.resize({ size: '100x100', url: Helper.images.local }, function(err, stdout, stderr) {
          expect(stdout).toBeDefined()
          expect(stdout).toMatch('100x67')
          done()
        })
      })

      it("throws an error if size is not passed", function() {
        expect(function() {
          this.imageMagick.resize({ url: Helper.images.local }, function(){})
        }.bind(this)).toThrow()

        this.moreDetailsPlease(/size-param/)
      })
    })

    describe('with url', function() {
      it('resizes images when size is passed', function(done) {
        this.resize({ size: '100x100', url: Helper.images.google }, function(err, stdout, stderr) {
          expect(stdout).toBeDefined()
          expect(stdout).toMatch('100x35')
          done()
        })
      })
    })

    describe('with french url', function() {
      it('resizes images when size is passed', function(done) {
        this.resize({ size: '100x100', url: Helper.images.french }, function(err, stdout, stderr) {
          expect(stdout).toBeDefined()
          expect(stdout).toMatch('83x100')
          done()
        })
      })
    })

    describe('with a big image', function() {
      describe('without configured timeouts', function() {
        it('resizes images when size is passed', function(done) {
          this.resize({ size: '640x480', url: Helper.images.big }, function(err, stdout, stderr) {
            expect(stdout).toBeDefined()
            expect(stdout).toMatch('640x427')
            done()
          })
        })
      })

      describe('with configured timeouts for convert', function() {
        before(function() {
          this.imageMagick = new ImageMagick({ timeouts: { convert: 1 }, tmpPathRoot: Helper.testTmpRoot })
        })

        it('resizes images when size is passed', function(done) {
          this.imageMagick.resize({ size: '640x480', url: Helper.images.big }, function(err, path) {
            expect(err.killed).toBeTrue()
            done()
          })
        })
      })

      describe('with configured timeouts for resize', function() {
        before(function() {
          this.imageMagick = new ImageMagick({ timeouts: { download: 1 }, tmpPathRoot: Helper.testTmpRoot })
        })

        it('resizes images when size is passed', function(done) {
          this.imageMagick.resize({ size: '640x480', url: Helper.images.big + '?' + ~~(Math.random() * 99999) }, function(err, path) {
            expect(err.killed).toBeTrue()
            done()
          })
        })
      })
    })

    describe('with size limit', function() {
      beforeEach(function() {
        this.imageMagick = new ImageMagick({ imageSizeLimit: 1000, tmpPathRoot: Helper.testTmpRoot })
      })

      it('works when size is below limit', function() {
        expect(function() {
          this.imageMagick.resize({ url: Helper.images.local, size: '100x200' }, function(){})
        }.bind(this)).not.toThrow()
      })

      it('throws an error when size is above limit', function() {
        expect(function() {
          this.imageMagick.resize({ url: Helper.images.local, size: '1100x200' }, function(){})
        }.bind(this)).toThrow()
      })
    })
  })

  describe('fit', function() {
    it('resizes images to the passed size', function(done) {
      this.fit({ size: '100x100', url: Helper.images.local }, function(err, stdout, stderr) {
        expect(stdout).toBeDefined()
        expect(stdout).toMatch('100x100')
        done()
      })
    })
  })

  describe('crop', function() {
    describe('without size', function() {
      it('throws an error if no crop param is passed', function() {
        expect(function() {
          this.crop({ url: Helper.images.local }, function(){})
        }.bind(this)).toThrow()
        this.moreDetailsPlease(/crop-param/)
      })

      it('resizes images to the size defined in crop param', function(done) {
        this.crop({ crop: '200x100+20+25', url: Helper.images.local }, function(err, stdout, stderr) {
          expect(stdout).toBeDefined()
          expect(stdout).toMatch('200x100')
          done()
        })
      })
    })

    describe('with size', function() {
      it('resizes images to passed size', function(done) {
        this.crop({ crop: '200x400+20+25', size: '100x200', url: Helper.images.local }, function(err, stdout, stderr) {
          expect(stdout).toBeDefined()
          expect(stdout).toMatch('100x200')
          done()
        })
      })
    })
  })

  describe('missing image', function() {
    it('is generated for invalid sources', function(done) {
      this.crop({ crop: '200x400+20+25', size: '100x200', url: "http://foo.bar" }, function(err, stdout, stderr) {
        expect(stdout).toBeDefined()
        expect(stdout).toMatch('100x200')
        done()
      })
    })
  })

  describe('_scaleCropInfo', function() {
    it('scales the passed cropping info according to source size', function() {
      expect(this.imageMagick._scaleCropInfo('200x300+10+10', ['375', ''], ['800', '600'])).toEqual('426x640+21+21')
    })
  })
})
