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

module.exports = (req, res) => {
  const { ids } = req.query
  const reqUserId = req.user != null ? req.user._id : undefined

  return promises_.try(parseAndValidateIds.bind(null, ids))
  .then(user_.getUsersIndexByIds(reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}

const parseAndValidateIds = ids => {
  if (!_.isNonEmptyString(ids)) throw error_.newMissingQuery('ids')

  ids = ids.split('|')
  if (((ids != null ? ids.length : undefined) > 0) && validUsersIds(ids)) {
    return ids
  } else {
    throw error_.newInvalid('ids', ids)
  }
}

const validUsersIds = ids => _.every(ids, User.validations.userId)
