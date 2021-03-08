const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const { shellExec } = require('scripts/scripts_utils')
const { backupGeneralFolder, backupFolder, day } = require('./get_backup_folder_data')

module.exports = async () => {
  await shellExec('tar', [
    '-zcf',
    // Output
    `${backupFolder}.tar.gz`,
    // Change directory (cf http://stackoverflow.com/a/18681628/3324977 )
    '-C', backupGeneralFolder,
    // Input path from the changed directory
    day
  ])
  await deleteFolder()
  _.log(`backup archived in ${backupGeneralFolder}`)
}

const deleteFolder = () => shellExec('rm', [ '-rf', backupFolder ])
