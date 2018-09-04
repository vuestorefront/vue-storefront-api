const CommandRouter = require('command-router')
const cli = CommandRouter()

const config = require('config').elasticsearch
const spawnSync = require('child_process').spawnSync

cli.option({
  name: 'input-file',
  default: 'var/catalog.json',
  type: String
})

cli.option({
  name: 'input-index',
  default: 'vue_storefront_catalog',
  type: String
})

cli.option({
  name: 'output-file',
  default: 'var/catalog.json',
  type: String
})

cli.option({
  name: 'output-index',
  default: 'vue_storefront_catalog_temp',
  type: String
})

function stdOutErr(stdout, stderr) {
  if (stdout.length > 0)
    console.log(stdout.toString('utf8'))
  if (stderr.length > 0)
    console.error(stderr.toString('utf8'))
}

cli.command('dump', () => {
  const input = `http://${config.host}:${config.port}/${cli.options['input-index']}`

  const child = spawnSync('node', [
    'node_modules/elasticdump/bin/elasticdump',
    `--input=${input}`,
    `--output=${cli.options['output-file']}`
  ])
  stdOutErr(child.stdout, child.stderr)
})

cli.command('restore', () => {
  const output = `http://${config.host}:${config.port}/${cli.options['output-index']}`

  const child = spawnSync('node', [
    'node_modules/elasticdump/bin/elasticdump',
    `--input=${cli.options['input-file']}`,
    `--output=${output}`
  ])
  stdOutErr(child.stdout, child.stderr)
})

cli.on('notfound', (action) => {
  console.error(`I don't know how to: ${action}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason)
})

process.on('uncaughtException', function(exception) {
  console.log(exception)
})

cli.parse(process.argv)
