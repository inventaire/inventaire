CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user'

passport = require 'passport'
passport_ = __.require 'lib', 'passport/passport'

cookieParser = require 'cookie-parser'
session = require 'cookie-session'

module.exports =
  cookieParser: cookieParser()
  session: session
    secret: CONFIG.secret
    # see https://github.com/expressjs/session#resave
    resave: false
  passport:
    initialize: passport.initialize()
    session: passport.session {pauseStream: true}
