CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'
setLoggedInCookie = require './lib/set_logged_in_cookie'

module.exports = (req, res, next) ->
  {action, email, token} = req.query
  unless action? then return error_.bundle res, 'no action specified', 400
  unless token? then return error_.bundle res, 'no token provided', 400
  unless email? then return error_.bundle res, 'no email provided', 400

  switch action
    when 'validation-email' then confirmEmailValidity res, email, token
    when 'reset-password' then allowPasswordReset req, res
    else error_.unknownAction res


confirmEmailValidity = (res, email, token)->
  user_.confirmEmailValidity(email, token)
  .then redirectValidEmail.bind(null, res, true)
  .catch redirectValidEmail.bind(null, res, false)

redirectValidEmail = (res, bool)->
  res.redirect "/?validEmail=#{bool}"

# reset password =
#    => start a session with email/token instead of username/pw
#    => redirect to the reset-password page
allowPasswordReset = (req, res)->
  passport_.authenticate.resetPassword req, res, Redirect(res)


Redirect = (res)->
  redirect = ->
    setLoggedInCookie res
    res.redirect '/login/reset-password'
