CONFIG = require 'config'
{ cookieMaxAge } = CONFIG
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'
setLoggedInCookie = require './lib/set_logged_in_cookie'

exports.signup = (req, res)->
  { strategy, username, email, password } = req.body

  unless _.isNonEmptyString username
    return error_.bundle req, res, 'missing username parameter', 400

  unless _.isNonEmptyString email
    return error_.bundle req, res, 'missing email parameter', 400

  unless _.isNonEmptyString password
    return error_.bundle req, res, 'missing password parameter', 400

  next = LoggedIn req, res
  switch strategy
    when 'local' then passport_.authenticate.localSignup(req, res, next)
    else error_.bundle req, res, "unknown signup strategy: #{strategy}", 400

exports.login = (req, res)->
  { strategy } = req.body
  next = LoggedIn req, res
  switch strategy
    when 'local' then passport_.authenticate.localLogin(req, res, next)
    else error_.bundle req, res, "unknown login strategy: #{strategy}", 400

LoggedIn = (req, res)->
  loggedIn = (result)->
    if result instanceof Error then error_.handler req, res, result
    else
      setLoggedInCookie res
      _.ok res

exports.logout = (req, res, next) ->
  res.clearCookie 'loggedIn'
  req.logout()
  res.redirect '/'