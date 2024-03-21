import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isPropertyId } from 'wikibase-sdk'
import { arrayIncludes, objLength } from '#lib/utils/base'
import { readJsonFile, writeJsonFile } from '#lib/utils/json'
import { success, info, warn } from '#lib/utils/logs'
import config from '#server/config'
import { wait } from './promises.js'

const { autofix, srcFolderPath } = config.i18n

const missingSrcFolderPathMessage = 'Set config.i18n.srcFolderPath in config/local-dev.cjs to automatically add missing i18n keys to your local inventaire-i18n repository'
export let appendToClientKeys = (keys: string[]) => {
  warn(keys, missingSrcFolderPathMessage)
}

export let appendToServerKeys = (key: string) => {
  warn(key, missingSrcFolderPathMessage)
}

let resolvedSrcFolderPath
if (autofix) {
  try {
    resolvedSrcFolderPath = resolve(process.cwd(), srcFolderPath)
    await stat(resolvedSrcFolderPath)

    const clientSourceFile = `${resolvedSrcFolderPath}/client/en.json`
    const clientWikidataIdsFile = `${resolvedSrcFolderPath}/client/keys_translated_from_wikidata`
    const serverSourceFile = `${resolvedSrcFolderPath}/server/en.json`
    const serverWikidataIdsFile = `${resolvedSrcFolderPath}/server/keys_translated_from_wikidata`

    // Using _ as the convention to identify short keys: ex: awesome_title
    // (that is, keys with an English value different than the key itself)
    // the underscore should be surrounded by letters, not spaces
    const shortKeyPattern = /^\w+_\w+$/

    appendToClientKeys = keys => appendToI18nKeys(clientSourceFile, clientWikidataIdsFile, keys)
    appendToServerKeys = key => appendToI18nKeys(serverSourceFile, serverWikidataIdsFile, [ key ])

    // Don't use 'require' as it will be cached until next start
    async function appendToI18nKeys (sourceFilePath: string, wikidataIdsFilePath: string, newKeys: string[]) {
    // Add a random pause so that several calls at the same time
    // are unlickly to conflict. Sort of a debounce ersatz
      await wait(Math.trunc(Math.random() * 1000))

      const keys = await readJsonFile(sourceFilePath)
      const wikidataIds = (await readFile(wikidataIdsFilePath)).toString().trim().split('\n')
      const keysCountBefore = objLength(keys)
      const wikidataIdsCountBefore = wikidataIds.length
      for (const key of newKeys) {
        if (isPropertyId(key)) {
          if (arrayIncludes(wikidataIds, key)) {
            info(`i18n: already there '${key}'`)
          } else {
            wikidataIds.push(key)
            success(`+i18n wikidata property: '${key}'`)
          }
        } else {
          if (keys[key]) {
            info(`i18n: already there '${key}'`)
          } else {
            keys[key] = shortKeyPattern.test(key) ? null : key
            success(`+i18n: '${key}'`)
          }
        }
      }

      if (objLength(keys) > keysCountBefore) {
        try {
          await writeJsonFile(sourceFilePath, keys)
          success(`i18n:updated ${sourceFilePath}`)
        } catch (err) {
          console.log('err', err)
        }
      } else {
        info(`i18n:not:updating ${sourceFilePath}: no new key`)
      }

      if (wikidataIds.length > wikidataIdsCountBefore) {
        try {
          await writeFile(wikidataIdsFilePath, wikidataIds.join('\n') + '\n')
          success(`i18n:updated ${wikidataIdsFilePath}`)
        } catch (err) {
          console.log('err', err)
        }
      } else {
        info(`i18n:not:updating ${wikidataIdsFilePath}: no new key`)
      }
    }
  } catch (err) {
    err.context = { resolvedSrcFolderPath, srcFolderPath }
    warn(err, missingSrcFolderPathMessage)
  }
}
