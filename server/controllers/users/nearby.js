const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')

const sanitization =
  { range: {} }

module.exports = (req, res) => {
  const reqUserId = req.user != null ? req.user._id : undefined
  sanitize(req, res, sanitization)
  .then(params => user_.nearby(reqUserId, params.range))
  .then(usersIds => user_.getUsersByIds(usersIds, reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}
