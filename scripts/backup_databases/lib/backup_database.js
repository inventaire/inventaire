require('module-alias/register')
const _ = require('builders/utils')
const { shellExec } = require('scripts/scripts_utils')
const { backupFolder } = require('./get_backup_folder_data')

module.exports = async params => {
  const { dbName } = params
  const args = buildArgsArray(params)

  const { stdout, stderr } = await shellExec('couchdb-backup', args)
  _.log(stdout, `${dbName} stdout`)
  _.warn(stderr, `${dbName} stderr`)
}

// Depends on 'couchdb-backup' (from https://github.com/danielebailo/couchdb-dump)
// being accessible from the $PATH
const buildArgsArray = ({ username, password, hostname, port, dbName }) => {
  const outputFile = `${backupFolder}/${dbName}.json`

  return [
    // Common parameters
    '-b', // backup mode
    '-H', hostname,
    '-P', port,
    '-u', username,
    '-p', password,
    // Database-specific
    '-d', dbName,
    '-f', outputFile
  ]
}
