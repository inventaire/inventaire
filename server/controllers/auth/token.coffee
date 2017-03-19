CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'
promises_ = __.require 'lib', 'promises'
setLoggedInCookie = require './lib/set_logged_in_cookie'

confirmEmailValidity = (req, res)->
  validateQuery req.query
  .spread user_.confirmEmailValidity
  .then redirectValidEmail.bind(null, res, true)
  .catch redirectValidEmail.bind(null, res, false)

redirectValidEmail = (res, bool, resp)->
  unless bool then _.error resp, 'email validation failed'
  res.redirect "/?validEmail=#{bool}"

validateQuery = (query)->
  { email, token } = query
  unless email? then return error_.rejectMissingQuery 'email'
  unless token? then return error_.rejectMissingQuery 'token'
  return promises_.resolve [ email, token ]

# reset password =
#    => start a session with email/token instead of username/pw
#    => redirect to the reset-password page
allowPasswordReset = (req, res)->
  validateQuery req.query
  .then -> passport_.authenticate.resetPassword req, res, Redirect(res)
  # Only handling validateQuery rejected errors,
  # passport_.authenticate, deals with its own errors
  .catch error_.Handler(req, res)

Redirect = (res)->
  redirect = ->
    setLoggedInCookie res
    res.redirect '/login/reset-password'

module.exports =
  get: ActionsControllers
    public:
      'validation-email': confirmEmailValidity
      'reset-password': allowPasswordReset
