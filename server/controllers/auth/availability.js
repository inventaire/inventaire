
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const user_ = __.require('controllers', 'user/lib/user')

exports.usernameAvailability = (req, res, next) => {
  const { username } = req.query
  // checks for validity, availability, reserve words
  return user_.availability.username(username)
  .then(() => res.json({ username, status: 'available' }))
  .catch(error_.Handler(req, res))
}

exports.emailAvailability = (req, res, next) => {
  const { email } = req.query
  // checks for validity, availability
  return user_.availability.email(email)
  .then(() => res.json({ email, status: 'available' }))
  .catch(error_.Handler(req, res))
}
