CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'controllers', 'user/lib/user'

exports.usernameAvailability = (req, res, next) ->
  { username } = req.query
  # checks for validity, availability, reserve words
  user_.availability.username username
  .then -> res.json {username: username, status: 'available'}
  .catch error_.Handler(req, res)


exports.emailAvailability = (req, res, next) ->
  { email } = req.query
  # checks for validity, availability
  user_.availability.email email
  .then -> res.json {email: email, status: 'available'}
  .catch error_.Handler(req, res)
