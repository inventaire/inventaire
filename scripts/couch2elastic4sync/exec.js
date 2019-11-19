// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Keep the desired CouchDB databases in sync with their ElasticSearch counterparts
// Set the databases to sync in CONFIG.elasticsearch.sync

const CONFIG = require('config')
const __ = CONFIG.universalPath
const { spawn } = require('child_process')
const folder = __.path('scripts', 'couch2elastic4sync')
const logsFolder = __.path('logs', 'couch2elastic4sync')
const fs = require('fs')
const { syncDataList } = __.require('db', 'elasticsearch/list')
const { red } = require('chalk')

// Mapping to couch2elastic4sync API:
// cliArg='sync' => couch2elastic4sync
// cliArg='load' => couch2elastic4sync load
module.exports = cliArg => {
  const childProcesses = syncDataList.map(syncData => {
    const { dbName } = syncData

    // Prefixing the command with nice, so that it get reniced to 10,
    // thus lowering those sub-processes priority
    // cf https://groups.google.com/forum/#!topic/nodejs/9O-2gLJzmcQ
    const command = 'nice'
    const args = [
      __.path('modulesBin', 'couch2elastic4sync'),
      `--config=${folder}/configs/${dbName}.json`
    ]

    if (cliArg === 'load') { args.push('load') }
    // if cliArg is 'sync', nothing needs to be added

    const logStream = getLogStream(dbName)

    const childProcess = spawn(command, args)
    childProcess.stdout.pipe(logStream)
    childProcess.stderr.on('data', logError)
    return childProcess
  })

  const killChildrenProcessesAndExit = () => {
    childProcesses.forEach(childProc => childProc.kill('SIGTERM'))
    // Exit the process itself as we overrided the default SIG(INT|TERM) behavior
    return process.exit(0)
  }

  process.on('SIGTERM', killChildrenProcessesAndExit)
  return process.on('SIGINT', killChildrenProcessesAndExit)
}

const getLogStream = dbName => {
  const logFile = `${logsFolder}/${dbName}`
  const logStream = fs.createWriteStream(logFile, { flags: 'a' })
  logStream.write(`\n--------- restarting: ${new Date()} ---------\n`)
  return logStream
}

const logError = chunk => console.error(red('couch2elastic4sync err'), chunk.toString())
