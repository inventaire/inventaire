CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'

passport = require 'passport'
passport_ = __.require 'lib', 'passport/passport'

cookieParser = require 'cookie-parser'
session = require 'cookie-session'
sessionParams =
  maxAge: 10*365*24*3600*1000
  secret: CONFIG.secret
  # see https://github.com/expressjs/session#resave
  resave: false

module.exports =
  cookieParser: cookieParser()
  session: session(sessionParams)
  passport:
    initialize: passport.initialize()
    session: passport.session {pauseStream: true}
