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
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const notifs_ = __.require('lib', 'notifications')
const promises_ = __.require('lib', 'promises')

const get = function(req, res){
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)

  return notifs_.byUserId(req.user._id)
  .then(responses_.Wrap(res, 'notifications'))
  .catch(error_.Handler(req, res))
}

const updateStatus = function(req, res){
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  const reqUserId = req.user._id

  const { times } = req.body
  if (!_.isArray(times) || (times.length <= 0)) return _.ok(res)

  // could probably be replaced by a batch operation
  return promises_.all(times.map(notifs_.updateReadStatus.bind(null, reqUserId)))
  .then(() => {
    _.success([ reqUserId, times ], 'notifs marked as read')
    return responses_.ok(res)}).catch(error_.Handler(req, res))
}

module.exports = { get, post: updateStatus }
