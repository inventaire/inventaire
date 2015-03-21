CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'

exports.usernameAvailability = (req, res, next) ->
  {username} = req.body
  # checks for validity, availability, reserve words
  user_.availability.username username
  .then -> res.json {username: username, status: 'available'}
  .catch error_.Handler(res)


exports.emailAvailability = (req, res, next) ->
  {email} = req.body
  # checks for validity, availability
  user_.availability.email email
  .then -> res.json {email: email, status: 'available'}
  .catch error_.Handler(res)
