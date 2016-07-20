__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res)->
  { id:entityId, lang, value } = req.body
  { _id:userId } = req.user

  _.log req.body, 'body'

  unless _.isLang lang
    return error_.bundle req, res, 'invalid 2-letters lang code', 400

  unless _.isNonEmptyString value
    return error_.bundle req, res, "value parameter can't be empty", 400

  entities_.byId entityId
  .then _.Log('doc')
  .then entities_.updateLabel.bind(null, lang, value, userId)
  .then _.Ok(res)
  .catch error_.Handler(req, res)
