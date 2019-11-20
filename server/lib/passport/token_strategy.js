const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const pw_ = __.require('lib', 'crypto').passwords
const error_ = __.require('lib', 'error/error')
const loginAttempts = require('./login_attempts')
const { Strategy: LocalStrategy } = require('passport-local')
const { tokenDaysToLive } = CONFIG

// reusing LocalStrategy but substituing username/password by email/token
const options = {
  usernameField: 'email',
  passwordField: 'token',
  passReqToCallback: true
}

const verify = (req, email, token, done) => {
  if (loginAttempts.tooMany(email)) {
    return done(null, false, { message: 'too_many_attempts' })
  }

  return user_.findOneByEmail(email)
  .catch(invalidEmailOrToken.bind(null, done, email, 'findOneByEmail'))
  .then(returnIfValid.bind(null, done, token, email))
  .catch(finalError.bind(null, done))
}

const returnIfValid = (done, token, email, user) => {
  // need to check user existance to avoid
  // to call invalidEmailOrToken a second time
  // in case findOneByemail returned an error
  if (user != null) {
    return verifyToken(user, token)
    .then(valid => {
      if (valid) {
        console.log('valid', valid)
        return user_.openPasswordUpdateWindow(user)
        .then(_.Log('clearToken res'))
        .then(() => done(null, user))
      } else {
        return invalidEmailOrToken(done, email, 'validity test')
      }
    })
    .catch(invalidEmailOrToken.bind(null, done, email, 'verifyToken'))
  }
}

const invalidEmailOrToken = (done, email, label, err) => {
  loginAttempts.recordFail(email, label)
  return done(null, false, { message: 'invalid_username_or_token' })
}

const verifyToken = (user, token) => {
  if (user.token == null) return error_.reject('no token found', 401)
  return pw_.verify(user.token, token, tokenDaysToLive)
}

const finalError = (done, err) => {
  _.error(err, 'TokenStrategy verify err')
  return done(err)
}

module.exports = new LocalStrategy(options, verify)
