const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const notifications_ = require('./lib/notifications')

module.exports = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  const reqUserId = req.user._id

  const { times } = req.body
  if (!_.isArray(times) || (times.length <= 0)) return _.ok(res)

  // could probably be replaced by a batch operation
  Promise.all(times.map(notifications_.updateReadStatus.bind(null, reqUserId)))
  .then(() => {
    _.success([ reqUserId, times ], 'notifs marked as read')
    responses_.ok(res)
  })
  .catch(error_.Handler(req, res))
}
