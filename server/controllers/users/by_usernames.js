// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const User = __.require('models', 'user')

module.exports = function(req, res){
  const { usernames } = req.query
  const reqUserId = req.user != null ? req.user._id : undefined

  return promises_.try(parseAndValidateUsernames.bind(null, usernames))
  .then(user_.getUsersIndexByUsernames(reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}

var parseAndValidateUsernames = function(usernames){
  if (!_.isNonEmptyString(usernames)) {
    throw error_.newMissingQuery('usernames')
  }

  usernames = usernames.split('|')

  if (((usernames != null ? usernames.length : undefined) > 0) && validUsersUsernames(usernames)) {
    return usernames
  } else {
    throw error_.newInvalid('usernames', usernames)
  }
}

var validUsersUsernames = usernames => _.every(usernames, User.validations.username)
