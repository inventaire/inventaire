const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const db = __.require('db', 'couchdb/base')('users')
const User = __.require('models', 'user')
const pw_ = __.require('lib', 'crypto').passwords
const { oneHour, expired } = __.require('lib', 'time')

module.exports = (req, res) => {
  const { user, body } = req
  const { 'current-password': currentPassword, 'new-password': newPassword } = body
  const { resetPassword } = user
  if (!User.validations.password(newPassword)) {
    return error_.bundleInvalid(req, res, 'new-password', user)
  }

  let test

  // classic password update
  if (currentPassword != null) {
    if (!User.validations.password(currentPassword)) {
      return error_.bundleInvalid(req, res, 'current-password', currentPassword)
    }
    test = verifyCurrentPassword(user, currentPassword)
    .then(isValid => {
      if (!isValid) {
        throw error_.newInvalid('current-password', user.email)
      }
    })

  // token-based password reset, with expiration date
  } else if (resetPassword != null) {
    if (!_.isNumber(resetPassword)) {
      return error_.bundle(req, res, 'invalid resetPassword timestamp', 500)
    }
    test = testOpenResetPasswordWindow(resetPassword)
  }

  if (test == null) {
    // it is a resetPassword request but without a valid reset
    return error_.bundle(req, res, 'reset password token expired: request a new token', 403)
  }

  return test
  .then(updatePassword.bind(null, user, newPassword))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const updatePassword = (user, newPassword) => {
  return pw_.hash(newPassword)
  .then(updateUserPassword.bind(null, user._id, user))
}

const verifyCurrentPassword = (user, currentPassword) => pw_.verify(user.password, currentPassword)

const updateUserPassword = (userId, user, newHash) => {
  const updateFn = User.updatePassword.bind(null, user, newHash)
  return db.update(userId, updateFn)
}

const testOpenResetPasswordWindow = async resetPassword => {
  if (expired(resetPassword, oneHour)) {
    throw error_.new('reset password timespan experied', 400)
  }
}
