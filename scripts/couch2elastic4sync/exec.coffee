# Keep the desired CouchDB databases in sync with their ElasticSearch counterparts
# Set the databases to sync in CONFIG.elasticsearch.sync

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ elasticsearch:elasticConfig } = CONFIG
{ spawn } = require 'child_process'
folder = __.path 'scripts', 'couch2elastic4sync'
logsFolder = __.path 'logs', 'couch2elastic4sync'
fs  = require 'fs'
{ syncDataList } = __.require 'db', 'elasticsearch/list'

# Mapping to couch2elastic4sync API:
# cliArg='sync' => couch2elastic4sync
# cliArg='load' => couch2elastic4sync load
module.exports = (cliArg)->
  childProcesses = syncDataList.map (syncData)->
    { dbName } = syncData

    # Prefixing the command with nice, so that it get reniced to 10,
    # thus lowering those sub-processes priority
    # cf https://groups.google.com/forum/#!topic/nodejs/9O-2gLJzmcQ
    command = 'nice'
    args = [
      __.path 'modulesBin', 'couch2elastic4sync'
      "--config=#{folder}/configs/#{dbName}.json"
    ]

    if cliArg is 'load' then args.push 'load'
    # if cliArg is 'sync', nothing needs to be added

    logStream = getLogStream dbName

    childProcess = spawn command, args
    childProcess.stdout.pipe logStream
    # Unfortunately, couch2elastic4sync writes errors to stdout so this line doesn't have much effect
    childProcess.stderr.pipe logStream
    return childProcess

  killChildrenProcesses = -> childProcesses.forEach (childProc)-> childProc.kill()

  process.on 'exit', killChildrenProcesses
  process.on 'SIGINT', ->
    killChildrenProcesses()
    # Exit the process itself as we overrided the default SIGINT behavior
    process.exit 0

getLogStream = (dbName)->
  logFile = "#{logsFolder}/#{dbName}"
  logStream = fs.createWriteStream logFile, { flags: 'a' }
  logStream.write "\n--------- restarting: #{new Date} ---------\n"
  return logStream
