execa = require 'execa'

module.exports = (backupGeneralFolder, backupFolder, day)->
  execa 'tar', [
      '-zcf'
      # Output
      "#{backupFolder}.tar.gz"
      # Change directory (cf http://stackoverflow.com/a/18681628/3324977 )
      '-C', backupGeneralFolder
      # Input path from the changed directory
      day
    ]
  .then -> deleteFolder backupFolder

deleteFolder = (backupFolder)-> execa 'rm', [ '-rf', backupFolder ]
