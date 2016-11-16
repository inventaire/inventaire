#!/usr/bin/env coffee

# /!\ Using the action scripts custom settings
[ port, suffix ] = process.argv.slice 2
forcedArgs = {}
if port? then forcedArgs.port = port
if suffix? then forcedArgs.suffix = suffix
CONFIG = require('./lib/get_custom_config')(forcedArgs)

__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fs = require 'fs'
promises_ = __.require 'lib', 'promises'
execa = require 'execa'
{ username, password, host, port } = CONFIG.db
dbsNames = Object.keys __.require('couch', 'list').default
allDbsUrl = CONFIG.db.fullHost() + '/_all_dbs'

backupGeneralFolder = __.path 'couchdb', 'backups'
day = _.simpleDay()
backupFolder = "#{backupGeneralFolder}/#{day}"
try fs.mkdirSync backupFolder
catch err then _.warn err, 'mkdirSync err'

# Depends on 'couchdb-backup' (from https://github.com/danielebailo/couchdb-dump)
# being accessible from the $PATH
buildArgsArray = (dbName)->
  outputFile = "#{backupFolder}/#{dbName}.json"
  return [
    # Common parameters
    '-b' # backup mode
    '-H', host
    '-P', port
    '-u', username
    '-p', password
    # Database-specific
    '-d', dbName
    '-f', outputFile
  ]

backupDatabase = (dbName)->
  args = buildArgsArray dbName

  execa 'couchdb-backup', args
  .then (res)->
    _.log res.stdout, "#{dbName} stdout"
    _.warn res.stderr, "#{dbName} stderr"

# Filtering-out _replicator and _users
isDatabase = (dbName)-> dbName[0] isnt '_'

zipBackupFolder = ->
  execa 'tar', [
      '-zcf'
      # Output
      "#{backupFolder}.tar.gz"
      # Change directory (cf http://stackoverflow.com/a/18681628/3324977 )
      '-C', backupGeneralFolder
      # Input path from the changed directory
      day
    ]
  .then deleteFolder

deleteFolder = -> execa 'rm', [ '-rf', backupFolder ]

promises_.get allDbsUrl
.filter isDatabase
.then _.Log('databases to backup')
.map backupDatabase
.then -> _.log 'done doing backup'
.then zipBackupFolder
.then -> _.log 'cleaned'
.catch _.Error('databases backup err')
