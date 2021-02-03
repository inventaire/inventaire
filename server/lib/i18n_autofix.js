const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { readJsonFile, writeJsonFile } = __.require('utils', 'json')
const { isPropertyId } = require('wikidata-sdk')

module.exports = {
  appendToFullKeys: keys => appendToI18nKeys(full, keys, true),
  appendToShortKeys: keys => appendToI18nKeys(short, keys, false),
  appendToEmailsKeys: key => {
    const fullValue = !/^\w+_\w+/.test(key)
    return appendToI18nKeys(emails, [ key ], fullValue)
  }
}

// Don't use 'require' as it will be cached until next start
const appendToI18nKeys = async (path, newKeys, fullValue) => {
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

const full = __.path('i18nSrc', 'fullkey.en.json')
const short = __.path('i18nSrc', 'shortkey.en.json')
const emails = __.path('i18nSrc', 'emails.en.json')

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
