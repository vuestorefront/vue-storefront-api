const program = require('commander')
const config = require('config').redis
const kue = require('kue')

program
  .command('dashboard')
  .option('-p|--port <port>', 'port on which to run kue dashboard', 3000)
  .option('-q|--prefix <prefix>', 'prefix', 'q')
  .action((cmd) => {
    kue.createQueue({
      redis: config,
      prefix: cmd.prefix
    })

    kue.app.listen(cmd.port)
  });

program
  .on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.error(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`)
  // application specific logging, throwing an error, or other logic here
})

process.on('uncaughtException', (exception) => {
  console.error(exception) // to see your exception details in the console
  // if you are on production, maybe you can send the exception details to your
  // email as well ?
})
