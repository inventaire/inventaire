const __ = require('config').universalPath
const user_ = require('controllers/user/lib/user')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const responses_ = require('lib/responses')

const sanitization = {
  range: {}
}

module.exports = (req, res) => {
  const reqUserId = req.user && req.user._id
  sanitize(req, res, sanitization)
  .then(params => user_.nearby(reqUserId, params.range))
  .then(usersIds => user_.getUsersByIds(usersIds, reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}
