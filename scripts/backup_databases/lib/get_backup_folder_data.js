import CONFIG from 'config'
import _ from 'builders/utils'
import fs from 'node:fs'
import path from 'node:path'
const day = _.simpleDay()
const backupGeneralFolder = path.resolve(process.cwd(), CONFIG.db.backupFolder)
const backupFolder = path.resolve(backupGeneralFolder, `./${day}`)

try {
  fs.mkdirSync(backupFolder, { recursive: true })
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}

_.info(backupFolder, 'backup folder')

export default { backupFolder, backupGeneralFolder, day }
