#!/usr/bin/env node

// Usage:
//   npm run backup-databases http://username:password@localhost:5984 prod

const [ couchdbUrl, suffix ] = process.argv.slice(2)

require('module-alias/register')
const _ = require('builders/utils')
const getDatabasesNames = require('./lib/get_databases_names')
const backupDatabase = require('./lib/backup_database')
const zipBackupFolder = require('./lib/zip_backup_folder')

const { username, password, hostname, port } = new URL(couchdbUrl)

const dbsNames = getDatabasesNames(suffix)
_.log(dbsNames, 'databases to backup')

const backup = async () => {
  await Promise.all(dbsNames.map(dbName => {
    return backupDatabase({ username, password, hostname, port, dbName })
  }))
  _.success('done doing backup')
  await zipBackupFolder()
  _.success('cleaned')
}

backup()
.catch(_.Error('databases backup err'))
