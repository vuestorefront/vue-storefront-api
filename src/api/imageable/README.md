# What is imageable doing?

You can put imageable into your express application, where it acts as middleware.
Calling specific URLs (look below) will return resized and cropped images.

# How to get it run.

In your express app you will find a section like this:

```js
app.configure(function(){
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  //...
  app.use(app.router)
})
```

To plug imageable into your app, just add the following ABOVE the router:

```js
app.use(imageable(config, options))
```

Here is what an app should look like:

## app.js ##
```js
var fs     = require("fs")
  , config = JSON.parse(fs.readFileSync(__dirname + "/config/config.json"))

app.configure(function(){
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(imageable(config, {
    before: function(stats) { console.log('before') },
    after: function(stats, returnValueOfBefore, err) { console.log('after') }
  }))
  app.use(app.router)
})
```

Notice that the after-callback will have the returned value of the before-callback as
second parameter. Using that mechanism, you can for example track custom statistics.
The third parameter is furthermore containing an error if something went wrong. Nevertheless
the error gets thrown to end the request.

The middleware will automatically track some statistics, such as request,
average processing time etc. You can access them via the stats parameter.


## config/config.json ##
```js
{
  "secret":       "my-very-secret-secret",
  "magicHash":    "magic",
  "namespace":    "",
  "maxListeners": 512,
  "imageSizeLimit": 1024,
  "timeouts": {
    convert: 5000,
    identify: 100,
    download: 1000
  }
  "reporting": {
    "interval": 10,
    "commands": [
      'curl -s http://foo.bar.org/report?avg=%{avg}',
      'curl -s http://foo.bar.org/report?count=%{count}'
    ]
  },
  "whitelist": {
    "allowedHosts": [".*google\.com", ".*facebook\.com"],
    "trustedHosts": [".*google\.com"]
  },

  // -- keepDownloads --
  // Don't delete downloaded files but use them when the same url is requested twice.
  // This can be pretty handy if you don't have a CDN in front of the resizer.
  // Make sure that you always have enough HDD space !
  //
  // default: false
  // added in: v0.10.0
  "keepDownloads": true,

  // -- maxDownloadCacheSize --
  // If you keep downloads you would most probably want to limit the size
  // of the download folder. Otherwise you will screw up your hard drive.
  // Once the specified limit is reached node-imageable will start to delete
  // the oldest files (20% of the existing files) in the download folder.
  // The value is the number of megabytes you want to allow.
  //
  // tl;dr;
  // Depending on the size of the source images, it might be not a good idea
  // to set this value to less than 100. That's based on the fact that the
  // server will only have a few files in the tmp folder and that deleting
  // 20% of them will still result in a greater amount of used hdd space.
  //
  // default: null
  // added in: v0.10.0
  "maxDownloadCacheSize": 1000,

  // -- tmpPathRoot --
  // The folder you want to store the downloaded files in.
  //
  // default: /tmp/node-image-imagick
  // added in: v0.10.0
  "tmpPathRoot": process.cwd() + '/tmp'
}
```

The reporting config defines an array of commands which will get executed each _interval_ seconds.<br/>
The whitelist config allows you furthermore to limit the hosts of image sources (allowedHosts) or
to trust specific hosts (trustedHosts), so you don't have to specify the hash of the params (see below).<br/>
The imageSizeLimit config can be used to specify a dimension limit. Setting it to 1024 will throw an error for requests like 1500x900.<br/>
The timeouts config can be used to cancel slow downloads, long running converts or identify commands. Values are in milliseconds.<br/>
You can also take a look at https://github.com/dawanda/node-imageable-server to get a further clue.

# Routes and namespacing

Here you can see the routes, imageable reacts on.

    # resize an image with keeping ratio
    http://localhost:3000/resize?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # resize an image to given size without keeping the ratio
    http://localhost:3000/fit?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # crop a specific area of an image
    http://localhost:3000/crop?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&crop=200x200%2B20%2B40

    # crop a specific area and resize it with keeping the ratio
    http://localhost:3000/crop?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&crop=200x200%2B20%2B40&size=100x50

    # if secret is provided in config/config.json, all urls must have a hash following the resize method (see Hashing)
    http://localhost:3000/fit/-hash-?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # use the magic hash code that is valid for all requests, e.g. for testing
    http://localhost:3000/fit/-magic-hash-?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # append any fancy name for nice looking urls and image downloads
    http://localhost:3000/fit/-hash-/Fancy-Ignored-Name.gif?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # this is super edgy, but you can use it if you need it: scale the cropping clip according to another image dimension.
    # this will calculate the ratio between the other image dimension and the passed (via url param) image's dimension and scale the cropping information (crop param)
    http://localhost:3000/crop?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&crop=200x200%2B20%2B40&size=100x50&cropSourceSize=500x

If you specify the namespace in your config (let's say to 'imageable'), all routes will be scoped to /imageable/fit... or /imageable/crop and so on.

# Hashing
To make sure nobody missuses your image-server you can enable hashing in the config/config.json and all requests must be hashed.

    # Node
    var crypto    = require("crypto")
      , srcImgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
      , query     = 'url=' + srcImgUrl + '&size=200x200'
      , hash      = crypto.createHash('md5').update(query + config.secret).digest("hex").slice(0,8)
      , url       = "http://localhost:3000/resize/" + hash + "/Very-Nice-Image.gif?" + query

    res.send('<img src="' + url + '" />')


    # RUBY
    require 'digest/md5'

    def resized_image_tag(url, size)
      query_options = {:url => url, :size => size}
      digest        = Digest::MD5.new
      hash          = digest.hexdigest(query_options.to_query + CFG[:node_imageable_secret])[0..7]

      image_tag "http://localhost:3000/resize/#{hash}/Very-Nice-Image.gif?#{query_options.to_query}"
    end

    resized_image_tag("http://www.google.com/intl/en_ALL/images/logo.gif", "200x200")

# Running the tests

    npm test

# TODO

 - add 'expand' which would add whitespace to fill missing image areas

# Authors/Contributors

- DaWanda GmbH
- Sascha Depold ([Twitter](http://twitter.com/sdepold) | [Github](http://github.com/sdepold) | [Website](http://depold.com))
