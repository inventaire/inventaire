import _ from '#builders/utils'
import { shellExec } from '#scripts/scripts_utils'
import { backupFolder } from './get_backup_folder_data.js'

export default async params => {
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
    '-f', outputFile,
  ]
}
