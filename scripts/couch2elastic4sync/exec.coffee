# Mapping to couch2elastic4sync API:
# arg='sync' => couch2elastic4sync 
# arg='load' => couch2elastic4sync load

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ elasticsearch:elasticConfig } = CONFIG
execa = require 'execa'
folder = __.path 'scripts', 'couch2elastic4sync'
logsFolder = __.path 'logs', 'couch2elastic4sync'
{ Promise } = __.require 'lib', 'promises'

fs  = require 'fs'

module.exports = (arg)->
  _.info "starting couch2elastic4sync #{arg}"

  promises = elasticConfig.sync.map (syncData)->
    { type } = syncData
    args = [ "--config=#{folder}/configs/#{type}.json" ]

    if arg is 'load' then args.push arg
    # if arg is 'sync', nothing needs to be pushed to args

    childProcess = execa 'couch2elastic4sync', args

    logFile = fs.createWriteStream "#{logsFolder}/#{type}"

    childProcess.stdout.pipe logFile
    childProcess.stderr.pipe logFile

    # execa childProcess objects are also promises
    return childProcess

  return Promise.all promises
  .catch _.Error("couch2elastic4sync #{arg} err")
