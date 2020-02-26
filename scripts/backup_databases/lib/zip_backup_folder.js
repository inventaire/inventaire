const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const execa = require('execa')
const { backupGeneralFolder, backupFolder, day } = require('./get_backup_folder_data')()

module.exports = () => {
  return execa('tar', [
    '-zcf',
    // Output
    `${backupFolder}.tar.gz`,
    // Change directory (cf http://stackoverflow.com/a/18681628/3324977 )
    '-C', backupGeneralFolder,
    // Input path from the changed directory
    day
  ])
  .then(() => deleteFolder())
  .then(() => _.log(`backup archived in ${backupGeneralFolder}`))
}

const deleteFolder = () => execa('rm', [ '-rf', backupFolder ])
