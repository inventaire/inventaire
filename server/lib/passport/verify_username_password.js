// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const pw_ = __.require('lib', 'crypto').passwords
const loginAttempts = require('./login_attempts')

const { Strategy:LocalStrategy } = require('passport-local')

module.exports = function(username, password, done){

  if (loginAttempts.tooMany(username)) {
    return done(null, false, { message: 'too_many_attempts' })
  }

  // addressing the case an email is provided instead of a username
  return user_.findOneByUsernameOrEmail(username)
  .catch(invalidUsernameOrPassword.bind(null, done, username, 'findOneByUsername'))
  .then(returnIfValid.bind(null, done, password, username))
  .catch(finalError.bind(null, done))
}

var returnIfValid = function(done, password, username, user){
  // need to check user existance to avoid
  // to call invalidUsernameOrPassword a second time
  // in case findOneByUsername returned an error
  if (user != null) {
    return verifyUserPassword(user, password)
    .then((valid) => {
      if (valid) { return done(null, user)
      } else { return invalidUsernameOrPassword(done, username, 'validity test') }}).catch(invalidUsernameOrPassword.bind(null, done, username, 'verifyUserPassword'))
  }
}

var invalidUsernameOrPassword = function(done, username, label){
  loginAttempts.recordFail(username, label)
  return done(null, false, { message: 'invalid_username_or_password' })
}

var verifyUserPassword = (user, password) => pw_.verify(user.password, password)

var finalError = function(done, err){
  _.error(err, 'username/password verify err')
  return done(err)
}
