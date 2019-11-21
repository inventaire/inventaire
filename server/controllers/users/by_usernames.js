const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const User = __.require('models', 'user')

module.exports = (req, res) => {
  const { usernames } = req.query
  const reqUserId = req.user && req.user._id

  return promises_.try(parseAndValidateUsernames.bind(null, usernames))
  .then(user_.getUsersIndexByUsernames(reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}

const parseAndValidateUsernames = usernames => {
  if (!_.isNonEmptyString(usernames)) {
    throw error_.newMissingQuery('usernames')
  }

  usernames = usernames.split('|')

  if (usernames && usernames.length > 0 && validUsersUsernames(usernames)) {
    return usernames
  } else {
    throw error_.newInvalid('usernames', usernames)
  }
}

const validUsersUsernames = usernames => _.every(usernames, User.validations.username)
