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
requests_ = __.require 'lib', 'requests'

{ username, password, host, port } = CONFIG.db
dbsNames = Object.keys __.require('couch', 'list')
allDbsUrl = CONFIG.db.fullHost() + '/_all_dbs'

backupGeneralFolder = __.path 'couchdb', 'backups'
day = _.simpleDay()
backupFolder = "#{backupGeneralFolder}/#{day}"

try fs.mkdirSync backupFolder
catch err then _.warn err, 'mkdirSync err'

# Filtering-out _replicator and _users
isDatabase = (dbName)-> dbName[0] isnt '_'

backupDatabase = require './lib/backup_database'
zipBackupFolder = require './lib/zip_backup_folder'

params = { host, port, username, password, backupFolder }

requests_.get allDbsUrl
.filter isDatabase
.filter (dbName)-> dbName.match(suffix)
.then _.Log('databases to backup')
.map backupDatabase.bind(null, params)
.then -> _.log 'done doing backup'
.then -> zipBackupFolder backupGeneralFolder, backupFolder, day
.then -> _.log 'cleaned'
.catch _.Error('databases backup err')
