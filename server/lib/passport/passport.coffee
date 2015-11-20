CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'

passport = require 'passport'

passport.serializeUser (user, done) ->
  _.types [user, done], ['object', 'function']
  _.success id = user._id, 'serializeUser'
  done null, id

passport.deserializeUser (id, done) ->
  _.types [id, done], ['string', 'function']
  user_.byId(id)
  .then (user)->
    done(null, user)
  .catch (err)->
    _.error err, 'err'
    done(err)

passport.use 'local-login', require('./local_login_strategy')
passport.use 'local-signup', require('./local_signup_strategy')
# browserid startegy handles both login and signup
passport.use 'browserid', require('./browser_id_strategy')
passport.use 'token', require('./token_strategy')

module.exports =
  passport: passport
  authenticate:
    localLogin: passport.authenticate 'local-login'
    localSignup: passport.authenticate 'local-signup'
    browserid: passport.authenticate 'browserid'
    resetPassword: passport.authenticate 'token',
      failureRedirect: '/login/forgot-password?resetPasswordFail=true'
