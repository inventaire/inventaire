import { absolutePath } from '#lib/absolute_path'
import { objLength } from '#lib/utils/base'
import { readJsonFile, writeJsonFile } from '#lib/utils/json'
import { success, info } from '#lib/utils/logs'
import { wait } from './promises.js'

const clientSourceFile = absolutePath('i18nSrc', 'client/en.json')
const serverSourceFile = absolutePath('i18nSrc', 'server/en.json')

// Using _ as the convention to identify short keys: ex: awesome_title
// (that is, keys with an English value different than the key itself)
// the underscore should be surrounded by letters, not spaces
const shortKeyPattern = /^\w+_\w+$/

export const appendToClientKeys = keys => appendToI18nKeys(clientSourceFile, keys)
export const appendToServerKeys = key => appendToI18nKeys(serverSourceFile, [ key ])

// Don't use 'require' as it will be cached until next start
const appendToI18nKeys = async (path, newKeys) => {
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
    return writeJsonFile(path, keys)
    .then(() => success(`i18n:updated ${path}`))
  } else {
    info(`i18n:not:updating ${path}: no new key`)
  }
}
