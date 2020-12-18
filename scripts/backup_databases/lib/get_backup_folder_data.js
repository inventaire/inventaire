const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const backupGeneralFolder = CONFIG.db.backupFolder
const fs = require('fs')
const path = require('path')
const day = _.simpleDay()
const backupFolder = path.resolve(process.cwd(), `${backupGeneralFolder}/${day}`)

try {
  fs.mkdirSync(backupFolder, { recursive: true })
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}

_.info(backupFolder, 'backup folder')

module.exports = { backupFolder, backupGeneralFolder, day }
