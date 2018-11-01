{ secret, cookieMaxAge } = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'

passport = require 'passport'
passport_ = __.require 'lib', 'passport/passport'

cookieParser = require 'cookie-parser'
session = require 'cookie-session'
sessionParams =
  maxAge: cookieMaxAge
  secret: secret
  # see https://github.com/expressjs/session#resave
  resave: false

module.exports =
  cookieParser: cookieParser()
  session: session(sessionParams)
  passport:
    initialize: passport.initialize()
    session: passport.session { pauseStream: true }

  basicAuth: (req, res, next)->
    unless req.headers.authorization? then return next()
    # TODO: handle response to avoid text/plain 401 response
    # to keep the API consistent on Content-Type
    passport_.authenticate.basic req, res, next
