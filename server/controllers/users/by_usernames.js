const __ = require('config').universalPath
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const user_ = require('controllers/user/lib/user')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  usernames: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { usernames, reqUserId } = params
    return user_.getUsersIndexByUsernames(reqUserId, usernames)
  })
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}
