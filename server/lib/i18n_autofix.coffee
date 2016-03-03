__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports =
  appendToFullKeys: (keys)-> appendToI18nKeys full, keys, true
  appendToShortKeys: (keys)-> appendToI18nKeys short, keys, false

  appendToEmailsKeys: (key)->
    fullValue = not /^\w+_\w+/.test(key)
    appendToI18nKeys emails, [key], fullValue

appendToI18nKeys = (path, newKeys, fullValue)->
  # don't use 'require' as it will be cached until next start
  _.jsonReadAsync path
  .then (keys)->
    lengthBefore = _.objLength keys
    for key in newKeys
      unless keys[key]
        if fullValue then val = key
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

  .catch _.Error('appendToI18nKeys err')

full = __.path 'client', 'public/i18n/src/fullkey/en.json'
short = __.path 'client', 'public/i18n/src/shortkey/en.json'
emails = __.path 'i18nSrc', 'en.json'
