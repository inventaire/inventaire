const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const user_ = __.require('controllers', 'user/lib/user')
const sanitize = __.require('lib', 'sanitize/sanitize')

module.exports = {
  usernameAvailability: (req, res, next) => {
    sanitize(req, res, { username: {} })
    .then(params => {
      const { username } = params
      // Checks for validity, availability, reserve words
      return user_.availability.username(username)
      .then(() => res.json({ username, status: 'available' }))
      .catch(error_.Handler(req, res))
    })
    .catch(error_.Handler(req, res))
  },

  emailAvailability: (req, res, next) => {
    sanitize(req, res, { email: {} })
    .then(params => {
      const { email } = params
      // Checks for validity, availability
      return user_.availability.email(email)
      .then(() => res.json({ email, status: 'available' }))
      .catch(error_.Handler(req, res))
    })
    .catch(error_.Handler(req, res))
  }
}
