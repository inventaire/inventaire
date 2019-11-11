/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = {
  appendToFullKeys(keys){ return appendToI18nKeys(full, keys, true) },
  appendToShortKeys(keys){ return appendToI18nKeys(short, keys, false) },

  appendToEmailsKeys(key){
    const fullValue = !/^\w+_\w+/.test(key)
    return appendToI18nKeys(emails, [ key ], fullValue)
  }
}

var appendToI18nKeys = (path, newKeys, fullValue) => // don't use 'require' as it will be cached until next start
  _.jsonReadAsync(path)
.then((keys) => {
  const lengthBefore = _.objLength(keys)
  for (const key of newKeys) {
    if (!keys[key]) {
      var val
      if (fullValue) { val = key
      } else { val = null }
      keys[key] = val
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
  }}).catch(_.Error('appendToI18nKeys err'))

var full = __.path('i18nSrc', 'fullkey.en.json')
var short = __.path('i18nSrc', 'shortkey.en.json')
var emails = __.path('i18nSrc', 'emails.en.json')
