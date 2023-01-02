import wdk from 'wikidata-sdk'
import _ from '#builders/utils'
import { absolutePath } from '#lib/absolute_path'
import { readJsonFile, writeJsonFile } from '#lib/utils/json'
import { wait } from './promises.js'

const { isPropertyId } = wdk

export const appendToFullKeys = keys => appendToI18nKeys(full, keys, true)
export const appendToShortKeys = keys => appendToI18nKeys(short, keys, false)
export const appendToServerKeys = key => {
  const fullValue = !/^\w+_\w+/.test(key)
  return appendToI18nKeys(server, [ key ], fullValue)
}

// Don't use 'require' as it will be cached until next start
const appendToI18nKeys = async (path, newKeys, fullValue) => {
  // Add a random pause so that several calls at the same time
  // are unlickly to conflict. Sort of a debounce ersatz
  await wait(Math.trunc(Math.random() * 1000))

  const keys = await readJsonFile(path)
  const lengthBefore = _.objLength(keys)
  for (const key of newKeys) {
    if (!keys[key]) {
      keys[key] = fullValue ? key : null
      _.success(`+i18n: '${key}'`)
    } else {
      _.info(`i18n: already there '${key}'`)
    }
  }

  if (_.objLength(keys) > lengthBefore) {
    return writeJsonFile(path, reorder(keys))
    .then(() => _.success(`i18n:updated ${path}`))
  } else {
    _.info(`i18n:not:updating ${path}: no new key`)
  }
}

const full = absolutePath('i18nSrc', 'fullkey.en.json')
const short = absolutePath('i18nSrc', 'shortkey.en.json')
const server = absolutePath('i18nSrc', 'server.en.json')

const reorder = keys => {
  const reordered = {}
  const addKey = key => { reordered[key] = keys[key] }

  // Add non-properties first
  Object.keys(keys)
  .filter(key => !isPropertyIdOrUri(key))
  .sort(alphabetically)
  .forEach(addKey)

  // Then, Wikidata properties
  Object.keys(keys)
  .filter(isPropertyId)
  .sort(byPropertyId)
  .forEach(addKey)

  // Then, Inventaire properties
  Object.keys(keys)
  .filter(key => key.startsWith('invp:'))
  .sort(byPropertyId)
  .forEach(addKey)

  return reordered
}

const alphabetically = (a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1
const byPropertyId = (a, b) => parseInt(a.split('P')[1]) - parseInt(b.split('P')[1])

const isPropertyIdOrUri = str => isPropertyId(str) || str.startsWith('invp:')
