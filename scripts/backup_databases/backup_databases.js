#!/usr/bin/env node
const [ suffix ] = process.argv.slice(2)

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')

const getDatabasesNames = require('./lib/get_databases_names')
const backupDatabase = require('./lib/backup_database')
const zipBackupFolder = require('./lib/zip_backup_folder')

getDatabasesNames(suffix)
.then(_.Log('databases to backup'))
.then(promises_.map(backupDatabase))
.then(() => _.log('done doing backup'))
.then(zipBackupFolder)
.then(() => _.log('cleaned'))
.catch(_.Error('databases backup err'))
