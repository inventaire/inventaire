CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'
user_ = __.require 'controllers', 'user/lib/user'
sanitize = __.require 'lib', 'sanitize/sanitize'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'
promises_ = __.require 'lib', 'promises'
setLoggedInCookie = require './lib/set_logged_in_cookie'

sanitization =
  email: {}
  token: { length: user_.tokenLength }

confirmEmailValidity = (req, res)->
  sanitize req, res, sanitization
  .then (input)-> user_.confirmEmailValidity input.email, input.token
  .then redirectValidEmail.bind(null, res, true)
  .catch redirectValidEmail.bind(null, res, false)

redirectValidEmail = (res, bool, resp)->
  unless bool then _.error resp, 'email validation failed'
  res.redirect "/?validEmail=#{bool}"

# reset password =
#    => start a session with email/token instead of username/pw
#    => redirect to the reset-password page
allowPasswordReset = (req, res)->
  sanitize req, res, sanitization
  .then -> passport_.authenticate.resetPassword req, res, Redirect(res)
  # Only handling sanitization rejected errors,
  # passport_.authenticate, deals with its own errors
  .catch error_.Handler(req, res)

Redirect = (res)-> ()->
  setLoggedInCookie res
  res.redirect '/login/reset-password'

module.exports =
  get: ActionsControllers
    public:
      'validation-email': confirmEmailValidity
      'reset-password': allowPasswordReset
