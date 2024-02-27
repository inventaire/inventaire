import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import CONFIG from 'config'
import { objLength } from '#lib/utils/base'
import { readJsonFile, writeJsonFile } from '#lib/utils/json'
import { success, info, warn } from '#lib/utils/logs'
import { wait } from './promises.js'

const { srcFolderPath } = CONFIG.i18n

const missingSrcFolderPathMessage = 'Set CONFIG.i18n.srcFolderPath in config/local-dev.cjs to automatically add missing i18n keys to your local inventaire-i18n repository'
export let appendToClientKeys = (keys: string[]) => {
  warn(keys, missingSrcFolderPathMessage)
}

export let appendToServerKeys = (key: string) => {
  warn(key, missingSrcFolderPathMessage)
}

let resolvedSrcFolderPath
try {
  resolvedSrcFolderPath = resolve(process.cwd(), srcFolderPath)
  await stat(resolvedSrcFolderPath)

  const clientSourceFile = `${resolvedSrcFolderPath}/client/en.json`
  const serverSourceFile = `${resolvedSrcFolderPath}/server/en.json`

  // Using _ as the convention to identify short keys: ex: awesome_title
  // (that is, keys with an English value different than the key itself)
  // the underscore should be surrounded by letters, not spaces
  const shortKeyPattern = /^\w+_\w+$/

  appendToClientKeys = keys => appendToI18nKeys(clientSourceFile, keys)
  appendToServerKeys = key => appendToI18nKeys(serverSourceFile, [ key ])

  // Don't use 'require' as it will be cached until next start
  async function appendToI18nKeys (path, newKeys) {
    // Add a random pause so that several calls at the same time
    // are unlickly to conflict. Sort of a debounce ersatz
    await wait(Math.trunc(Math.random() * 1000))

    const keys = await readJsonFile(path)
    const lengthBefore = objLength(keys)
    for (const key of newKeys) {
      if (!keys[key]) {
        keys[key] = shortKeyPattern.test(key) ? null : key
        success(`+i18n: '${key}'`)
      } else {
        info(`i18n: already there '${key}'`)
      }
    }

    if (objLength(keys) > lengthBefore) {
      try {
        await writeJsonFile(path, keys)
        success(`i18n:updated ${path}`)
      } catch (err) {
        console.log('err', err)
      }
    } else {
      info(`i18n:not:updating ${path}: no new key`)
    }
  }
} catch (err) {
  err.context = { resolvedSrcFolderPath, srcFolderPath }
  warn(err, missingSrcFolderPathMessage)
}
