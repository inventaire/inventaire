__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res)->
  { id:entityId, lang, value } = req.body
  { _id:reqUserId } = req.user

  _.log req.body, 'body'

  unless entityId? then return error_.bundleMissingBody req, res, 'id'
  unless lang? then return error_.bundleMissingBody req, res, 'lang'
  unless value?.trim() then return error_.bundleMissingBody req, res, 'value'

  value = value.trim()

  unless _.isInvEntityId entityId
    return error_.bundleInvalid req, res, 'id', entityId

  unless _.isLang lang
    return error_.bundleInvalid req, res, 'lang', lang

  unless _.isNonEmptyString value
    return error_.bundleInvalid req, res, 'value', value

  entities_.byId entityId
  .then _.Log('doc')
  .then entities_.updateLabel.bind(null, lang, value, reqUserId)
  .then _.Ok(res)
  .catch error_.Handler(req, res)
