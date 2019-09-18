const program = require('commander')
const config = require('config').elasticsearch
const spawnSync = require('child_process').spawnSync

function stdOutErr (stdout, stderr) {
  if (stdout.length > 0) { console.log(stdout.toString('utf8')) }
  if (stderr.length > 0) { console.error(stderr.toString('utf8')) }
}

program
  .command('dump')
  .option('--input-index <inputIndex>', 'index to dump', 'vue_storefront_catalog')
  .option('--output-file <outputFile>', 'path to the output file', 'var/catalog.json')
  .action((cmd) => {
    const input = `http://${config.host}:${config.port}/${cmd.inputIndex}`

    const child = spawnSync('node', [
      'node_modules/elasticdump/bin/elasticdump',
      `--input=${input}`,
      `--output=${cmd.outputFile}`
    ])
    stdOutErr(child.stdout, child.stderr)
  })

program
  .command('restore')
  .option('--output-index <outputIndex>', 'index to restore', 'vue_storefront_catalog')
  .option('--input-file <inputFile>', 'path to the input file', 'var/catalog.json')
  .action((cmd) => {
    const output = `http://${config.host}:${config.port}/${cmd.outputIndex}`

    const child = spawnSync('node', [
      'node_modules/elasticdump/bin/elasticdump',
      `--input=${cmd.inputFile}`,
      `--output=${output}`
    ])
    stdOutErr(child.stdout, child.stderr)
  })

program
  .on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})

process.on('uncaughtException', (exception) => {
  console.log(exception)
})
