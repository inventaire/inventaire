__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'controllers', 'user/lib/user'
User = __.require 'models', 'user'

module.exports = (req, res)->
  { usernames } = req.query
  reqUserId = req.user?._id

  promises_.try parseAndValidateUsernames.bind(null, usernames)
  .then user_.getUsersIndexByUsernames(reqUserId)
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)

parseAndValidateUsernames = (usernames)->
  unless _.isNonEmptyString usernames
    throw error_.newMissingQuery 'usernames'

  usernames = usernames.split '|'

  if usernames?.length > 0 and validUsersUsernames(usernames)
    return usernames
  else
    throw error_.newInvalid 'usernames', usernames

validUsersUsernames = (usernames)-> _.all usernames, User.validations.username
