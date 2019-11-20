#!/usr/bin/env node

/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const [ suffix ] = Array.from(process.argv.slice(2))

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const getDatabasesNames = require('./lib/get_databases_names')
const backupDatabase = require('./lib/backup_database')
const zipBackupFolder = require('./lib/zip_backup_folder')

getDatabasesNames(suffix)
.then(_.Log('databases to backup'))
.map(backupDatabase)
.then(() => _.log('done doing backup'))
.then(zipBackupFolder)
.then(() => _.log('cleaned'))
.catch(_.Error('databases backup err'))
