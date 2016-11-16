#!/usr/bin/env coffee

# /!\ Using the action scripts custom settings
CONFIG = require './lib/get_custom_config'

__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fs = require 'fs'
{ spawn } = require 'child_process'
{ username, password, host, port } = CONFIG.db
dbsNames = Object.keys __.require('couch', 'list').default

backupGeneralFolder = __.path 'couchdb', 'backups'
day = _.simpleDay()
backupFolder = "#{backupGeneralFolder}/#{day}"
try fs.mkdirSync backupFolder
catch err then _.warn err, 'mkdirSync err'

# Depends on 'couchdb-backup' (from https://github.com/danielebailo/couchdb-dump)
# being accessible from the $PATH
buildArgsArray = (dbBaseName)->
  dbName = CONFIG.db.name dbBaseName
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

backupDatabase = (dbBaseName)->
  args = buildArgsArray dbBaseName
  spawn 'couchdb-backup', args, { stdio: 'inherit' }

dbsNames.forEach backupDatabase
