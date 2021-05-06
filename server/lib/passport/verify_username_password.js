// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('builders/utils')
const user_ = require('controllers/user/lib/user')
const pw_ = require('lib/crypto').passwords
const loginAttempts = require('./login_attempts')

module.exports = (username, password, done) => {
  if (loginAttempts.tooMany(username)) {
    done(null, false, { message: 'too_many_attempts' })
  }

  // addressing the case an email is provided instead of a username
  return user_.findOneByUsernameOrEmail(username)
  .catch(invalidUsernameOrPassword.bind(null, done, username, 'findOneByUsername'))
  .then(returnIfValid.bind(null, done, password, username))
  .catch(finalError.bind(null, done))
}

const returnIfValid = (done, password, username, user) => {
  // need to check user existance to avoid
  // to call invalidUsernameOrPassword a second time
  // in case findOneByUsername returned an error
  if (!user) return

  return verifyUserPassword(user, password)
  .then(valid => {
    if (valid) done(null, user)
    else return invalidUsernameOrPassword(done, username, 'validity test')
  })
  .catch(invalidUsernameOrPassword.bind(null, done, username, 'verifyUserPassword'))
}

const invalidUsernameOrPassword = (done, username, label) => {
  loginAttempts.recordFail(username, label)
  done(null, false, { message: 'invalid_username_or_password' })
}

const verifyUserPassword = (user, password) => pw_.verify(user.password, password)

const finalError = (done, err) => {
  _.error(err, 'username/password verify err')
  done(err)
}
