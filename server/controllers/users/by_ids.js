const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const User = __.require('models', 'user')

module.exports = (req, res) => {
  const { ids } = req.query
  const reqUserId = req.user && req.user._id

  return promises_.try(parseAndValidateIds.bind(null, ids))
  .then(user_.getUsersIndexByIds(reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}

const parseAndValidateIds = ids => {
  if (!_.isNonEmptyString(ids)) throw error_.newMissingQuery('ids')

  ids = ids.split('|')
  if (ids && ids.length > 0 && validUsersIds(ids)) {
    return ids
  } else {
    throw error_.newInvalid('ids', ids)
  }
}

const validUsersIds = ids => _.every(ids, User.validations.userId)
