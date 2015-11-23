__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports =
  appendToFullKeys: (keys)-> appendToI18nKeys full, keys, true
  appendToShortKeys: (keys)-> appendToI18nKeys short, keys, false
  appendToEmailsKeys: (keys)-> appendToI18nKeys emails, keys, false

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
emails = __.path 'i18nSrc', 'en.json'
