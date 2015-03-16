__ = require('config').root
_ = __.require 'builders', 'utils'

module.exports =
  # if this route is enabled by CONFIG
  # allows the client to notify the server of i18n keys without a value
  i18nMissingKeys: (req, res, next)->
    _.info missingKeys = req.body?.missingKeys, 'i18n missing keys'

    unless missingKeys? and _.areStrings(missingKeys)
      _.errorHandler res, "bad missingKeys #{missingKeys}", 400
      return

    shortKeys = []
    fullKeys = []
    missingKeys.forEach (key)->
      # using _ as the convention to identify short keys: ex: awesome_title
      # (that is, keys with an english value different than the key itself)
      # the underscore should be surrended by letters, not spaces
      if /\w+_\w+/.test(key) then shortKeys.push(key)
      else fullKeys.push(key)

    appendToShortKeys(shortKeys)
    appendToFullKeys(fullKeys)
    res.send('ok')


appendToFullKeys = (keys)-> appendToI18nKeys full, keys, true
appendToShortKeys = (keys)-> appendToI18nKeys short, keys, false

appendToI18nKeys = (path, newKeys, value)->
  keys = _.jsonRead path
  lengthBefore = _.objLength(keys)
  newKeys.forEach (key)->
    unless keys[key]
      if value then val = key
      else val = null
      keys[key] = val
      _.success "+i18n: '#{key}'"
    else
      _.info "i18n: already there '#{key}'"

  if _.objLength(keys) > lengthBefore
    _.jsonWrite path, keys
    _.success "i18n:updating #{path}"
  else
    _.info "i18n:not:updating #{path}: no new key"

full = __.path 'client', 'public/i18n/src/fullkey/en.json'
short = __.path 'client', 'public/i18n/src/shortkey/en.json'
