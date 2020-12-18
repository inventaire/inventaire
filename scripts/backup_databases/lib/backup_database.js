const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { shellExec } = __.require('scripts', 'scripts_utils')
const { backupFolder } = require('./get_backup_folder_data')
const { username, password, hostname: host, port } = CONFIG.db

module.exports = async dbName => {
  const args = buildArgsArray(backupFolder, dbName)

  const { stdout, stderr } = await shellExec('couchdb-backup', args)
  _.log(stdout, `${dbName} stdout`)
  _.warn(stderr, `${dbName} stderr`)
}

// Depends on 'couchdb-backup' (from https://github.com/danielebailo/couchdb-dump)
// being accessible from the $PATH
const buildArgsArray = (backupFolder, dbName) => {
  const outputFile = `${backupFolder}/${dbName}.json`

  return [
    // Common parameters
    '-b', // backup mode
    '-H', host,
    '-P', port,
    '-u', username,
    '-p', password,
    // Database-specific
    '-d', dbName,
    '-f', outputFile
  ]
}
