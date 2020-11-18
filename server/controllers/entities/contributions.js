// An endpoint to list entities edits made by a user
const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const patches_ = require('./lib/patches')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 10000 },
  offset: { default: 0 }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { user: userId, limit, offset } = params
    if (userId != null) {
      return patches_.byUserId(userId, limit, offset)
    } else {
      return patches_.byDate(limit, offset)
    }
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
