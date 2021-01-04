const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const notifications_ = require('./lib/notifications')

const sanitization = {
  limit: { optional: true, default: 10 },
  offset: { optional: true },
}

module.exports = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)

  sanitize(req, res, sanitization)
  .then(getNotifications)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const getNotifications = params => {
  return notifications_.byUserId(params.reqUserId)
  .then(paginate(params))
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
