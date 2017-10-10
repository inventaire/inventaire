CONFIG = require 'config'
{ cookieMaxAge } = CONFIG
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'
setLoggedInCookie = require './lib/set_logged_in_cookie'
{ ownerSafeData } = __.require 'controllers', 'user/lib/authorized_user_data_pickers'

exports.signup = (req, res)->
  # TODO: rate limit to 10 signup per IP per 10 minutes
  { username, email, password } = req.body

  unless _.isNonEmptyString username
    return error_.bundleMissingBody req, res, 'username'

  unless _.isNonEmptyString email
    return error_.bundleMissingBody req, res, 'email'

  unless _.isNonEmptyString password
    return error_.bundleMissingBody req, res, 'password'

  next = LoggedIn req, res
  passport_.authenticate.localSignup req, res, next

exports.login = (req, res)->
  next = LoggedIn req, res
  passport_.authenticate.localLogin req, res, next

LoggedIn = (req, res)->
  loggedIn = (result)->
    if result instanceof Error then error_.handler req, res, result
    else
      setLoggedInCookie res
      data = { ok: true }
      # add a 'include-user-data' option to access user data directly from the login request
      # Use case: inventaire-wiki (jingo) login
      # https://github.com/inventaire/jingo/blob/635f5417b7ca5a99bad60b32c1758ccecd0e3afa/lib/auth/local-strategy.js#L26
      if req.query['include-user-data'] then data.user = ownerSafeData req.user
      res.json data

exports.logoutRedirect = logoutRedirect = (redirect, req, res, next)->
  res.clearCookie 'loggedIn'
  req.logout()
  res.redirect redirect

exports.logout = logoutRedirect.bind null, '/'
