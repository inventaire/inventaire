CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'

passport = require 'passport'

passport.serializeUser (user, done)->
  _.types [ user, done ], [ 'object', 'function' ]
  _.success id = user._id, 'serializeUser'
  done null, id

passport.deserializeUser (id, done)->
  _.types [ id, done ], [ 'string', 'function' ]
  user_.byId id
  .then (user)-> done null, user
  .catch (err)->
    if err.statusCode is 404
      err = error_.new "Couldn't deserialize cookies: user not found", 400, id
      err.name = 'SessionError'

    _.error err, 'deserializeUser err'
    done err

passport.use 'local-login', require('./local_login_strategy')
passport.use 'local-signup', require('./local_signup_strategy')
passport.use 'token', require('./token_strategy')
passport.use 'basic', require('./basic_strategy')

module.exports =
  passport: passport
  authenticate:
    localLogin: passport.authenticate 'local-login'
    localSignup: passport.authenticate 'local-signup'
    resetPassword: passport.authenticate 'token',
      failureRedirect: '/login/forgot-password?resetPasswordFail=true'
    basic: passport.authenticate 'basic', { session: false }
