const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { appendToFullKeys, appendToShortKeys } = __.require('lib', 'i18n_autofix')

// if this route is enabled by CONFIG
// allows the client to notify the server of i18n keys without a value
const i18nMissingKeys = (req, res, next) => {
  let { missingKeys } = req.body

  if (missingKeys == null) {
    return error_.bundleMissingBody(req, res, 'token')
  }

  if (!areStrings(missingKeys)) {
    return error_.bundleInvalid(req, res, 'missingKeys', missingKeys)
  }

  _.info(missingKeys, 'i18n missing keys')

  // Filtering out keys longer than 500 characters or starting by 400 or 500:
  // its most probably an undesired error message
  missingKeys = missingKeys.filter(key => ((key != null ? key.length : undefined) < 500) && !/^(4|5)00/.test(key))

  const shortKeys = []
  const fullKeys = []
  for (const key of missingKeys) {
    // using _ as the convention to identify short keys: ex: awesome_title
    // (that is, keys with an english value different than the key itself)
    // the underscore should be surrended by letters, not spaces
    if (/\w+_\w+/.test(key)) {
      shortKeys.push(key)
    } else {
      fullKeys.push(key)
    }
  }

  appendToShortKeys(shortKeys)
  appendToFullKeys(fullKeys)
  return responses_.ok(res)
}

const areStrings = array => _.every(array, _.isString)

module.exports = { post: i18nMissingKeys }
