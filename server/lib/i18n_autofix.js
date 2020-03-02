const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { readJsonFile, writeJsonFile } = __.require('utils', 'json')

module.exports = {
  appendToFullKeys: keys => appendToI18nKeys(full, keys, true),
  appendToShortKeys: keys => appendToI18nKeys(short, keys, false),

  appendToEmailsKeys: key => {
    const fullValue = !/^\w+_\w+/.test(key)
    return appendToI18nKeys(emails, [ key ], fullValue)
  }
}

// Don't use 'require' as it will be cached until next start
const appendToI18nKeys = (path, newKeys, fullValue) => {
  return readJsonFile(path)
  .then(keys => {
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
      return writeJsonFile(path, keys)
      .then(() => _.success(`i18n:updated ${path}`))
    } else {
      _.info(`i18n:not:updating ${path}: no new key`)
    }
  })
  .catch(_.Error('appendToI18nKeys err'))
}

const full = __.path('i18nSrc', 'fullkey.en.json')
const short = __.path('i18nSrc', 'shortkey.en.json')
const emails = __.path('i18nSrc', 'emails.en.json')
