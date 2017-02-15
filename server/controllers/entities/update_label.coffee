__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res)->
  { id:entityId, lang, value } = req.body
  { _id:reqUserId } = req.user

  _.log req.body, 'body'

  unless _.isInvEntityId entityId
    return error_.bundle req, res, 'invalid id', 400

  unless _.isLang lang
    return error_.bundle req, res, 'invalid 2-letters lang code', 400

  unless _.isNonEmptyString value.trim()
    return error_.bundle req, res, "value parameter should be an non empty string", 400

  value = value.trim()

  entities_.byId entityId
  .then _.Log('doc')
  .then entities_.updateLabel.bind(null, lang, value, reqUserId)
  .then _.Ok(res)
  .catch error_.Handler(req, res)
