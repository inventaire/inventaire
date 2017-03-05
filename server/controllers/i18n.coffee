__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ appendToFullKeys, appendToShortKeys } = __.require 'lib', 'i18n_autofix'

# if this route is enabled by CONFIG
# allows the client to notify the server of i18n keys without a value
i18nMissingKeys = (req, res, next)->
  { missingKeys } = req.body

  unless missingKeys? and _.areStrings(missingKeys)
    return error_.bundle req, res, 'bad missingKeys', 400, missingKeys

  _.info missingKeys, 'i18n missing keys'

  # Filtering out keys longer than 500 characters or starting by 400 or 500:
  # its most probably an undesired error message
  missingKeys = missingKeys.filter (key)->
    key?.length < 500 and not /^(4|5)00/.test(key)

  shortKeys = []
  fullKeys = []
  for key in missingKeys
    # using _ as the convention to identify short keys: ex: awesome_title
    # (that is, keys with an english value different than the key itself)
    # the underscore should be surrended by letters, not spaces
    if /\w+_\w+/.test(key) then shortKeys.push(key)
    else fullKeys.push(key)

  appendToShortKeys shortKeys
  appendToFullKeys fullKeys
  _.ok res

module.exports = { post: i18nMissingKeys }
