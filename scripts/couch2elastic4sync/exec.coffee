# Keep the desired CouchDB databases in sync with their ElasticSearch counterparts
# Set the databases to sync in CONFIG.elasticsearch.sync

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ elasticsearch:elasticConfig } = CONFIG
{ base:elasticBase } = elasticConfig
execa = require 'execa'
{ exec } = require 'child_process'
folder = __.path 'scripts', 'couch2elastic4sync'
logsFolder = __.path 'logs', 'couch2elastic4sync'
promises_ = __.require 'lib', 'promises'
{ Promise } = promises_
fs  = require 'fs'
meta = __.require 'lib', 'meta'
psTree = Promise.promisify require('ps-tree')

module.exports = (arg)->
  cleanupPreviousInstances()
  .then -> startProcesses arg
  .catch _.Error("couch2elastic4sync #{arg} err")

# Mapping to couch2elastic4sync API:
# arg='sync' => couch2elastic4sync
# arg='load' => couch2elastic4sync load
startProcesses = (arg)->
  pids = []

  elasticConfig.sync.map (syncData)->
    { type } = syncData
    command = "couch2elastic4sync --config=#{folder}/configs/#{type}.json"

    if arg is 'load' then command += ' load'
    # if arg is 'sync', nothing needs to be added

    logFile = "#{logsFolder}/#{type}"
    # Redirecting both stdin and stderr to the log file
    command = "#{command} >> #{logFile} 2>&1"

    # Simply using the 'child_process' module exec here, as we don't need
    # to keep its promise or anything: it will keep hanging around for the whole
    # process time
    child = exec command, (err, res)->
      if err then _.log err, "#{command} err"
      else _.log res, "#{command} res"

    pids.push child.pid

  _.info "starting couch2elastic4sync #{arg} processes: #{pids}"
  return meta.put 'couch2elastic4sync:pids', pids

# couch2elastic4sync processes aren't terminating on supervisor SIGTERM
# thus the need to kill them manually
cleanupPreviousInstances = ->
  meta.get 'couch2elastic4sync:pids'
  .then (pids)->
    if _.isNonEmptyArray pids
      # Thoses pids are only the subshells:
      # couch2elastic4sync processes will be referenced as their children
      return Promise.all pids.map(killPidChildrenProcesses)
    else
      # First run checks
      return createIndexIfMissing()

killPidChildrenProcesses = (pid)->
  psTree pid
  # Extract processes children pids
  .map _.property('PID')
  .then _.Log('previous couch2elastic4sync processes killed')
  .then killByPids

killByPids = (pids)-> execa.spawn 'kill', ['-9'].concat(pids)

createIndexIfMissing = ->
  promises_.get elasticBase
  .catch (err)->
    if err.status is 404 then return promises_.put elasticBase
    else throw err
