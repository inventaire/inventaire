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

# Mapping to couch2elastic4sync API:
# cliArg='sync' => couch2elastic4sync
# cliArg='load' => couch2elastic4sync load
module.exports = (cliArg)->
  childProcesses = elasticConfig.sync.map (syncData)->
    { type } = syncData
    command = "#{process.cwd()}/node_modules/.bin/couch2elastic4sync"
    args = [ "--config=#{folder}/configs/#{type}.json" ]

    if cliArg is 'load' then args.push 'load'
    # if cliArg is 'sync', nothing needs to be added

    logStream = getLogStream type

    childProcess = spawn command, args
    childProcess.stdout.pipe logStream
    # Unfortunately, couch2elastic4sync writes errors to stdout so this line doesn't have much effect
    childProcess.stderr.pipe logStream
    return childProcess

  killChildrenProcesses = -> childProcesses.forEach (childProc)-> childProc.kill()

  process.on 'exit', killChildrenProcesses
  process.on 'SIGINT', killChildrenProcesses

getLogStream = (type)->
  logFile = "#{logsFolder}/#{type}"
  logStream = fs.createWriteStream logFile, {flags: 'a'}
  logStream.write "\n--------- restarting: #{new Date} ---------\n"
  return logStream
