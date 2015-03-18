CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
promises_ = __.require 'lib', 'promises'
passport_ = __.require 'lib', 'passport/passport'

module.exports.signup = (req, res, next)->
  # _.log arguments, 'signup arguments'
  _.log req.body, 'req.body'
  {strategy} = req.body
  switch strategy
    when 'local' then passport_.authenticate.localSignup(req, res, next)
    else _.errorHandler(res, "unknown signup strategy: #{strategy}", 400)

module.exports.login = (req, res, next)->
  {strategy} = req.body
  switch strategy
    when 'local' then passport_.authenticate.localLogin(req, res, next)
    when 'browserid' then passport_.authenticate.browserid(req, res, next)
    else _.errorHandler(res, "unknown login strategy: #{strategy}", 400)

module.exports.logout = (req, res, next) ->
  res.clearCookie 'loggedIn'
  req.logout()
  res.redirect "/"


module.exports.checkUsername = (req, res, next) ->
  {username} = req.body
  # checks for validity, availability, reserve words
  user_.availability.username username
  .then -> res.json {username: username, status: 'available'}
  .catch catchAvailabilityError.bind(null, res, username, 'username')


module.exports.checkEmail = (req, res, next) ->
  {email} = req.body
  # checks for validity, availability
  user_.availability.email email
  .then -> res.json {email: email, status: 'available'}
  .catch catchAvailabilityError.bind(null, res, email, 'email')


catchAvailabilityError = (res, value, label, err)->
  {type} = err
  if type is 'not_available'
    obj =
      status: type
      status_verbose: "this #{label} is already used"
    obj[label] = value
    res.status(400).json obj
  else _.errorHandler(res, "invalid #{label}", 400)

module.exports.token = require './token'
