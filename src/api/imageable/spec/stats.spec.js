var buster   = require('buster')
  , Stats    = require(__dirname + '/../lib/stats.js')
  , testfile = __dirname + '/tmp/testfile'
  , fs       = require('fs')
  , config   = {
      "interval": 10,
      "commands": [ "echo %{avg} >> " + testfile ]
    }

buster.spec.expose()
buster.testRunner.timeout = 10000

describe('Stats', function() {
  before(function() {
    this.stats = new Stats(config)
  })

  describe('record', function() {
    it("adds a new record", function() {
      expect(this.stats.data.requests.length).toBe(0)
      this.stats.record(100)
      expect(this.stats.data.requests.length).toBe(1)
    })
  })

  describe('format', function() {
    it("returns valid object for no data", function() {
      expect(this.stats.format()).toEqual({ count: 0, avg: 0 })
    })

    it("returns formatted object for a single record", function() {
      this.stats.record(100)
      expect(this.stats.format()).toEqual({ count: 1, avg: 100 })
    })

    it("returns formatted object for many record", function() {
      this.stats.record(100)
      this.stats.record(50)
      expect(this.stats.format()).toEqual({ count: 2, avg: 75 })
    })
  })

  describe('reset', function() {
    it("resets the records", function() {
      this.stats.record(100)
      expect(this.stats.data.requests.length).toBe(1)
      this.stats.reset()
      expect(this.stats.data.requests.length).toBe(0)
    })
  })

  describe('reportNeeded', function() {
    it('returns false if interval is not passed', function() {
      this.stats.reportedAt = Date.now() - 9*1000
      expect(this.stats.reportNeeded()).toBeFalsy()
    })

    it("returns true if interval is passed", function() {
      this.stats.reportedAt = Date.now() - 11*1000
      expect(this.stats.reportNeeded()).toBeTruthy()
    })
  })

  describe('report', function() {
    before(function() {
      var testfile = __dirname + '/tmp/testfile-' + Math.floor(Math.random() * 9999)

      this.stats = new Stats({
        "interval": 10,
        "commands": [ "echo %{avg} >> " + testfile ],
        "testfile": testfile
      })
    })

    after(function() {
      try { fs.unlinkSync(this.stats.config.testfile) } catch(e) { }
    })

    it("it executes all commands", function(done) {
      this.stats.report(function() {
        expect(fs.readFileSync(this.stats.config.testfile).toString()).toEqual('0\n')
        done()
      }.bind(this))
    })

    it("it executes all commands and inserts values", function(done) {
      this.stats.record(100)
      this.stats.record(50)

      this.stats.report(function() {
        expect(fs.readFileSync(this.stats.config.testfile).toString()).toEqual('75\n')
        done()
      }.bind(this))
    })
  })
})
