'use harmony'

const CommandRouter = require('command-router')
const cli = CommandRouter()

const util = require('util');
const config = require('config').redis
const kue = require('kue');

cli.option({
  name: 'port',
  alias: 'p',
  default: 3000,
  type: Number
})

cli.option({
  name: 'prefix',
  alias: 'q',
  default: 'q',
  type: String
})

cli.command('dashboard', () => {
  var redis = util.format('redis://%s:%d', config.host, config.port);

  kue.createQueue({
    redis: redis,
    prefix: cli.options.prefix
  });

  kue.app.listen(cli.options.port);
})

cli.on('notfound', (action) => {
  console.error('I don\'t know how to: ' + action)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

process.on('uncaughtException', function(exception) {
  console.log(exception);
});

cli.parse(process.argv);
