const program = require('commander')
const config = require('config').redis
const kue = require('kue')

program
  .option('-p|--port <port>', 'port to listen to', 3000)
  .option('-q|--prefix <prefix>', 'prefix of key names used by Redis', 'q')
  .command('dashboard')
  .action((cmd) => {
    kue.createQueue({
      redis: {
        host: config.host,
        port: config.port,
        db: config.db
      },
      prefix: cmd.prefix
    })

    kue.app.listen(cmd.port)
  })

program
  .on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.log(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`)
})

process.on('uncaughtException', function(exception) {
  console.log(exception)
})
