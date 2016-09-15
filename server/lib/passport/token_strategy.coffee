CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
pw_ = __.require('lib', 'crypto').passwords
error_ = __.require 'lib', 'error/error'
loginAttempts = require './login_attempts'
{ Strategy:LocalStrategy } = require 'passport-local'

# reusing LocalStrategy but substituing username/password by email/token
options =
  usernameField: 'email'
  passwordField: 'token'
  passReqToCallback: true

verify = (req, email, token, done)->
  if loginAttempts.tooMany(email)
    return done null, false, { message: 'too_many_attempts' }

  user_.findOneByEmail(email)
  .catch invalidEmailOrToken.bind(null, done, email, 'findOneByEmail')
  .then returnIfValid.bind(null, done, token, email)
  .catch finalError.bind(null, done)

returnIfValid = (done, token, email, user)->
  # need to check user existance to avoid
  # to call invalidEmailOrToken a second time
  # in case findOneByemail returned an error
  if user?
    verifyToken(user, token)
    .then (valid)->
      if valid
        console.log 'valid', valid
        user_.openPasswordUpdateWindow user
        .then _.Log('clearToken res')
        .then -> done null, user
      else invalidEmailOrToken(done, email, 'validity test')
    .catch invalidEmailOrToken.bind(null, done, email, 'verifyToken')

invalidEmailOrToken = (done, email, label, err)->
  loginAttempts.recordFail email, label
  done null, false, { message: 'invalid_username_or_token' }

verifyToken = (user, token)->
  # should test expiration date here
  # waiting for credential 0.2.6
  unless user.token? then return error_.reject 'no token found', 401
  pw_.verify user.token, token

finalError = (done, err)->
  _.error err, 'TokenStrategy verify err'
  done err


module.exports = new LocalStrategy options, verify
