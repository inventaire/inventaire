const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = {
  appendToFullKeys: keys => appendToI18nKeys(full, keys, true),
  appendToShortKeys: keys => appendToI18nKeys(short, keys, false),

  appendToEmailsKeys: key => {
    const fullValue = !/^\w+_\w+/.test(key)
    return appendToI18nKeys(emails, [ key ], fullValue)
  }
}

const appendToI18nKeys = (path, newKeys, fullValue) => // don't use 'require' as it will be cached until next start
  _.jsonReadAsync(path)
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
    _.jsonWrite(path, keys)
    return _.success(`i18n:updating ${path}`)
  } else {
    return _.info(`i18n:not:updating ${path}: no new key`)
  }
}).catch(_.Error('appendToI18nKeys err'))

const full = __.path('i18nSrc', 'fullkey.en.json')
const short = __.path('i18nSrc', 'shortkey.en.json')
const emails = __.path('i18nSrc', 'emails.en.json')
