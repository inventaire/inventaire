__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res)->
  { id, uri, lang, value } = req.body
  _.log req.body, 'update label body'
  if _.isInvEntityId(id) and not uri? then uri = "inv:#{id}"

  unless uri? then return error_.bundleMissingBody req, res, 'uri'
  unless lang? then return error_.bundleMissingBody req, res, 'lang'
  unless value? then return error_.bundleMissingBody req, res, 'value'

  [ prefix, id ] = uri.split ':'
  updater = updaters[prefix]
  unless updater?
    return error_.bundle req, res, "unsupported uri prefix: #{prefix}", 400, uri

  unless _.isLang lang
    return error_.bundleInvalid req, res, 'lang', lang

  value = if _.isString(value) then value.trim() else value

  unless _.isNonEmptyString value
    return error_.bundleInvalid req, res, 'value', value

  updater req.user, id, lang, value
  .then _.Ok(res)
  .catch error_.Handler(req, res)

updaters =
  inv: require './lib/update_inv_label'
  wd: require './lib/update_wd_label'
