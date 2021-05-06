// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('builders/utils')
const user_ = require('controllers/user/lib/user')
const { openPasswordUpdateWindow } = require('controllers/user/lib/token')
const pw_ = require('lib/crypto').passwords
const error_ = require('lib/error/error')
const loginAttempts = require('./login_attempts')
const { Strategy: LocalStrategy } = require('passport-local')
const { tokenDaysToLive } = require('config')

// Reusing LocalStrategy but substituing username/password by email/token
const options = {
  usernameField: 'email',
  passwordField: 'token',
  passReqToCallback: true
}

const verify = (req, email, token, done) => {
  if (loginAttempts.tooMany(email)) {
    done(null, false, { message: 'too_many_attempts' })
  }

  return user_.findOneByEmail(email)
  .catch(invalidEmailOrToken.bind(null, done, email, 'findOneByEmail'))
  .then(returnIfValid.bind(null, done, token, email))
  .catch(finalError.bind(null, done))
}

const returnIfValid = (done, token, email, user) => {
  // Need to check user existance to avoid
  // to call invalidEmailOrToken a second time
  // in case findOneByemail returned an error
  if (!user) return

  return verifyToken(user, token)
  .then(valid => {
    if (valid) {
      console.log('valid', valid)
      return openPasswordUpdateWindow(user)
      .then(_.Log('clearToken res'))
      .then(() => done(null, user))
    } else {
      return invalidEmailOrToken(done, email, 'validity test')
    }
  })
  .catch(invalidEmailOrToken.bind(null, done, email, 'verifyToken'))
}

const invalidEmailOrToken = (done, email, label, err) => {
  loginAttempts.recordFail(email, label)
  done(null, false, { message: 'invalid_username_or_token' })
}

const verifyToken = async (user, token) => {
  if (user.token == null) throw error_.new('no token found', 401)
  return pw_.verify(user.token, token, tokenDaysToLive)
}

const finalError = (done, err) => {
  _.error(err, 'TokenStrategy verify err')
  done(err)
}

module.exports = new LocalStrategy(options, verify)
