// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const backupGeneralFolder = CONFIG.db.backupFolder
const fs = require('fs')

module.exports = function() {
  const day = _.simpleDay()
  const backupFolder = `${backupGeneralFolder}/${day}`

  try {
    fs.mkdirSync(backupFolder)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }

  return { backupFolder, backupGeneralFolder, day }
}
