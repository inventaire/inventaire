#!/usr/bin/env coffee

[ suffix ] = process.argv.slice 2

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

getDatabasesNames = require './lib/get_databases_names'
backupDatabase = require './lib/backup_database'
zipBackupFolder = require './lib/zip_backup_folder'

getDatabasesNames suffix
.then _.Log('databases to backup')
.map backupDatabase
.then -> _.log 'done doing backup'
.then zipBackupFolder
.then -> _.log 'cleaned'
.catch _.Error('databases backup err')
