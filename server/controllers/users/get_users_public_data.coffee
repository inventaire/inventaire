__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
parseAndValidateIds = require './lib/parse_and_validate_ids'

module.exports = (req, res)->
  { ids } = req.query
  promises_.try parseAndValidateIds.bind(null, ids)
  .then _.partialRight(user_.getUsersPublicData, 'index')
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)
