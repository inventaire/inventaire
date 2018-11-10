__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
user_ = __.require 'controllers', 'user/lib/user'
User = __.require 'models', 'user'

module.exports = (req, res)->
  { ids } = req.query
  reqUserId = req.user?._id

  promises_.try parseAndValidateIds.bind(null, ids)
  .then user_.getUsersIndexByIds(reqUserId)
  .then responses_.Wrap(res, 'users')
  .catch error_.Handler(req, res)

parseAndValidateIds = (ids)->
  unless _.isNonEmptyString ids then throw error_.newMissingQuery 'ids'

  ids = ids.split '|'
  if ids?.length > 0 and validUsersIds(ids) then return ids
  else throw error_.newInvalid 'ids', ids

validUsersIds = (ids)-> _.every ids, User.validations.userId
