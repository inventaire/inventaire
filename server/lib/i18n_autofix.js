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
  Object.keys(keys)
  .sort(alphabeticallyAndPropertiesLast)
  .forEach(key => {
    reordered[key] = keys[key]
  })
  return reordered
}

const alphabeticallyAndPropertiesLast = (a, b) => {
  if (isPropertyId(a) && isPropertyId(b)) {
    return parseInt(a.slice(1)) - parseInt(b.slice(1))
  } else if (isPropertyId(a)) {
    return 1
  } else if (isPropertyId(b)) {
    return -1
  } else {
    return a.toLowerCase() > b.toLowerCase() ? 1 : -1
  }
}
