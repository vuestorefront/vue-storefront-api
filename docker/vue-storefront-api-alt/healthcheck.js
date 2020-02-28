var http = require("http");

// replace path with health? (#374)
var options = {
  host: "localhost",
  path: "/api",
  port: "8080",
  timeout: 12000
};

var request = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", function (err) {
  console.log("ERROR");
  process.exit(1);
});

request.end();
