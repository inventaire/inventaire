const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const notifications_ = __.require('lib', 'notifications')

const sanitization = {
  limit: { optional: true, default: 10 },
  offset: { optional: true },
}

const paginate = params => notifications => {
  let { limit, offset } = params
  const total = notifications.length
  if (offset == null) offset = 0
  const last = offset + limit

  if (limit != null) {
    notifications = notifications.slice(offset, last)
    const data = { notifications, total, offset }
    if (last < total) data.continue = last
    return data
  } else {
    return { notifications, total, offset }
  }
}

const getNotifications = params => {
  return notifications_.byUserId(params.reqUserId)
  .then(paginate(params))
}

const get = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)

  return sanitize(req, res, sanitization)
  .then(getNotifications)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const updateStatus = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  const reqUserId = req.user._id

  const { times } = req.body
  if (!_.isArray(times) || (times.length <= 0)) return _.ok(res)

  // could probably be replaced by a batch operation
  return Promise.all(times.map(notifications_.updateReadStatus.bind(null, reqUserId)))
  .then(() => {
    _.success([ reqUserId, times ], 'notifs marked as read')
    responses_.ok(res)
  })
  .catch(error_.Handler(req, res))
}

module.exports = {
  get,
  post: updateStatus
}
