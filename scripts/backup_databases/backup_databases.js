#!/usr/bin/env node

// Usage:
//   npm run backup-databases prod

const [ suffix ] = process.argv.slice(2)

const _ = require('builders/utils')
const promises_ = require('lib/promises')

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
