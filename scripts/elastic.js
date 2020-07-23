const program = require('commander')
const config = require('config').elasticsearch
const spawnSync = require('child_process').spawnSync

function stdOutErr (stdout, stderr) {
  if (stdout.length > 0) { console.log(stdout.toString('utf8')) }
  if (stderr.length > 0) { console.error(stderr.toString('utf8')) }
}

/**
 * DUMP COMMAND
 */
const es5DumpCommand = (cmd) => {
  console.warn(`es5 is deprecated and will be removed in 1.13`)
  const input = `http://${config.host}:${config.port}/${cmd.inputIndex}`

  const child = spawnSync('node', [
    'node_modules/elasticdump/bin/elasticdump',
    `--input=${input}`,
    `--output=${cmd.outputFile}`
  ])
  stdOutErr(child.stdout, child.stderr)
}

const es7DumpCommand = (cmd) => {
  if (!cmd.outputFile.indexOf('.json')) {
    console.error('Please provide the file name ending with .json ext.')
  }
  for (var indexTypeIterator in config.indexTypes) {
    var collectionName = config.indexTypes[indexTypeIterator]
    var inputIndex = `${cmd.inputIndex}_${collectionName}`
    var outputFile = cmd.outputFile.replace('.json', `_${collectionName}.json`)
    const input = `http://${config.host}:${config.port}/${inputIndex}`

    const child = spawnSync('node', [
      'node_modules/elasticdump/bin/elasticdump',
      `--input=${input}`,
      `--output=${outputFile}`
    ])
    stdOutErr(child.stdout, child.stderr)
  }
}

program
  .command('dump')
  .option('--input-index <inputIndex>', 'index to dump', 'vue_storefront_catalog')
  .option('--output-file <outputFile>', 'path to the output file', 'var/catalog.json')
  .action((cmd) => {
    if (parseInt(config.apiVersion) < 6) {
      return es5DumpCommand(cmd)
    } else {
      return es7DumpCommand(cmd)
    }
  })

/**
 * RESTORE COMMAND
 */

const es5RestoreCommand = (cmd) => {
  console.warn(`es5 is deprecated and will be removed in 1.13`)
  const output = `http://${config.host}:${config.port}/${cmd.outputIndex}`

  const child = spawnSync('node', [
    'node_modules/elasticdump/bin/elasticdump',
    `--input=${cmd.inputFile}`,
    `--output=${output}`
  ])
  stdOutErr(child.stdout, child.stderr)
}

const es7RestoreCommand = (cmd) => {
  if (!cmd.inputFile.indexOf('.json')) {
    console.error('Please provide the file name ending with .json ext.')
  }
  for (var indexTypeIterator in config.indexTypes) {
    var collectionName = config.indexTypes[indexTypeIterator]
    var outputIndex = `${cmd.outputIndex}_${collectionName}`
    var inputFile = cmd.inputFile.replace('.json', `_${collectionName}.json`)

    const output = `http://${config.host}:${config.port}/${outputIndex}`

    const child = spawnSync('node', [
      'node_modules/elasticdump/bin/elasticdump',
      `--input=${inputFile}`,
      `--output=${output}`
    ])
    stdOutErr(child.stdout, child.stderr)
  }
}

program
  .command('restore')
  .option('--output-index <outputIndex>', 'index to restore', 'vue_storefront_catalog')
  .option('--input-file <inputFile>', 'path to the input file', 'var/catalog.json')
  .action((cmd) => {
    if (parseInt(config.apiVersion) < 6) {
      return es5RestoreCommand(cmd)
    } else {
      return es7RestoreCommand(cmd)
    }
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
