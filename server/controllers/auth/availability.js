const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const availability_ = require('controllers/user/lib/availability')

const usernameAvailabilitySanitization = {
  username: {}
}

const emailAvailabilitySanitization = {
  email: {}
}

module.exports = {
  usernameAvailability: (req, res) => {
    sanitize(req, res, usernameAvailabilitySanitization)
    .then(params => {
      const { username } = params
      // Checks for validity, availability, reserved words
      return availability_.username(username)
      .then(() => res.json({ username, status: 'available' }))
    })
    .catch(error_.Handler(req, res))
  },

  emailAvailability: (req, res) => {
    sanitize(req, res, emailAvailabilitySanitization)
    .then(params => {
      const { email } = params
      // Checks for validity, availability
      return availability_.email(email)
      .then(() => res.json({ email, status: 'available' }))
    })
    .catch(error_.Handler(req, res))
  }
}
