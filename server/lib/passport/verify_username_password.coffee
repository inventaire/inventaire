CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
pw_ = __.require('lib', 'crypto').passwords
loginAttempts = require './login_attempts'

{ Strategy:LocalStrategy } = require 'passport-local'

module.exports = (username, password, done)->

  if loginAttempts.tooMany(username)
    return done null, false, { message: 'too_many_attempts' }

  # addressing the case an email is provided instead of a username
  user_.findOneByUsernameOrEmail username
  .catch invalidUsernameOrPassword.bind(null, done, username, 'findOneByUsername')
  .then returnIfValid.bind(null, done, password, username)
  .catch finalError.bind(null, done)

returnIfValid = (done, password, username, user)->
  # need to check user existance to avoid
  # to call invalidUsernameOrPassword a second time
  # in case findOneByUsername returned an error
  if user?
    verifyUserPassword(user, password)
    .then (valid)->
      if valid then done null, user
      else invalidUsernameOrPassword(done, username, 'validity test')
    .catch invalidUsernameOrPassword.bind(null, done, username, 'verifyUserPassword')

invalidUsernameOrPassword = (done, username, label)->
  loginAttempts.recordFail(username, label)
  done null, false, { message: 'invalid_username_or_password' }

verifyUserPassword = (user, password)-> pw_.verify user.password, password

finalError = (done, err)->
  _.error err, 'username/password verify err'
  done err