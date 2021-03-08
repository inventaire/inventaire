const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const fs = require('fs')
const path = require('path')
const day = _.simpleDay()
const backupGeneralFolder = path.resolve(process.cwd(), CONFIG.db.backupFolder)
const backupFolder = path.resolve(backupGeneralFolder, `./${day}`)

try {
  fs.mkdirSync(backupFolder, { recursive: true })
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}

_.info(backupFolder, 'backup folder')

module.exports = { backupFolder, backupGeneralFolder, day }
