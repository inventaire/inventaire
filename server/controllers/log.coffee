__ = require('config').root
_ = __.require 'builders', 'utils'

module.exports =
  # if this route is enabled by CONFIG
  # allows the client to notify the server of i18n keys without a value
  i18nMissingKeys: (req, res, next)->
    _.info missingKey = req.body?.missingKey, 'i18n missing key'
    if _.isString(missingKey)
      # using _ as the convention to identify short keys: ex: awesome_title
      # (that is, keys with an english value different than the key itself)
      if /_/.test missingKey
        appendToShortKeys(missingKey)
        res.end()
      else
        appendToFullKeys(missingKey)
        res.end()
    else
      type = _.typeOf(missingKey)
      _.errorHandler res, "bad missingKey #{missingKey} (type:#{type})", 400


appendToFullKeys = (key)-> appendToI18nKeys full, key, key
appendToShortKeys = (key)-> appendToI18nKeys short, key, null

appendToI18nKeys = (path, key, value)->
  keys = _.jsonRead path
  unless keys[key]
    keys[key] = value
    _.jsonWrite path, keys
    _.success "+i18n: '#{key}'"

full = __.path 'client', 'public/i18n/src/fullkey/en.json'
short = __.path 'client', 'public/i18n/src/shortkey/en.json'
