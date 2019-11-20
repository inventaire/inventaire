
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const execa = require('execa')
const { backupGeneralFolder, backupFolder, day } = require('./get_backup_folder_data')()

module.exports = () => execa('tar', [
  '-zcf',
  // Output
  `${backupFolder}.tar.gz`,
  // Change directory (cf http://stackoverflow.com/a/18681628/3324977 )
  '-C', backupGeneralFolder,
  // Input path from the changed directory
  day
])
.then(() => deleteFolder(backupFolder))

const deleteFolder = backupFolder => execa('rm', [ '-rf', backupFolder ])
