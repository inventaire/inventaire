#!/usr/bin/env node
// Usage:
//   npm run backup-databases http://username:password@localhost:5984 prod

import _ from '#builders/utils'
import backupDatabase from './lib/backup_database.js'
import getDatabasesNames from './lib/get_databases_names.js'
import zipBackupFolder from './lib/zip_backup_folder.js'

const [ couchdbUrl, suffix ] = process.argv.slice(2)

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
