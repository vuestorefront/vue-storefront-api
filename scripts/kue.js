import CommandRouter from 'command-router'

const config = require('config').redis
const kue = require('kue')

const cli = CommandRouter()

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

  kue.createQueue({
    redis: {
      host: config.host,
      port: config.port,
      db: config.db
    },
    prefix: cli.options.prefix
  })

  kue.app.listen(cli.options.port)
})

cli.on('notfound', (action) => {
  console.error(`I don't know how to: ${action}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.log(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`)
})

process.on('uncaughtException', function(exception) {
  console.log(exception)
})

cli.parse(process.argv)
