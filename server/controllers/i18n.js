const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { appendToFullKeys, appendToShortKeys } = __.require('lib', 'i18n_autofix')
const errorMessagePattern = /^(4|5)00/
// Using _ as the convention to identify short keys: ex: awesome_title
// (that is, keys with an English value different than the key itself)
// the underscore should be surrounded by letters, not spaces
const shortKeyPattern = /\w+_\w+/

// if this route is enabled by CONFIG
// allows the client to notify the server of i18n keys without a value
const i18nMissingKeys = (req, res) => {
  let { missingKeys } = req.body

  if (missingKeys == null) {
    return error_.bundleMissingBody(req, res, 'token')
  }

  if (!areStrings(missingKeys)) {
    return error_.bundleInvalid(req, res, 'missingKeys', missingKeys)
  }

  _.info(missingKeys, 'i18n missing keys')

  missingKeys = missingKeys.filter(looksLikeAKey)

  const shortKeys = []
  const fullKeys = []
  for (const key of missingKeys) {
    if (shortKeyPattern.test(key)) shortKeys.push(key)
    else fullKeys.push(key)
  }

  appendToShortKeys(shortKeys)
  appendToFullKeys(fullKeys)
  responses_.ok(res)
}

const looksLikeAKey = key => {
  if (!key) return false
  // Filtering out keys longer than 500 characters
  if (key.length > 500) return false
  // or starting by 400 or 500: its most probably an undesired error message
  if (key.match(errorMessagePattern)) return false
  return true
}

const areStrings = array => _.every(array, _.isString)

module.exports = { post: i18nMissingKeys }
