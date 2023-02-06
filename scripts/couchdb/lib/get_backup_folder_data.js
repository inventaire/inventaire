import fs from 'node:fs'
import path from 'node:path'
import CONFIG from 'config'
import { simpleDay } from '#lib/utils/base'
import { info } from '#lib/utils/logs'

export const day = simpleDay()
export const backupGeneralFolder = path.resolve(process.cwd(), CONFIG.db.backupFolder)
export const backupFolder = path.resolve(backupGeneralFolder, `./${day}`)

try {
  fs.mkdirSync(backupFolder, { recursive: true })
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}

info(backupFolder, 'backup folder')
