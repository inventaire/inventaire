CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
User = __.require 'models', 'user'
pw_ = __.require('lib', 'crypto').passwords
{ oneHour } =  __.require 'lib', 'times'

module.exports = (req, res, next)->
  { user, body } = req
  { currentPassword, newPassword } = body
  { resetPassword } = user

  unless User.tests.password(newPassword)
    return error_.bundle req, res, 'invalid new password', 400

  # classic password update
  if currentPassword?
    unless User.tests.password(currentPassword)
      return error_.bundle req, res, 'invalid current password', 400
    test = verifyCurrentPassword(user, currentPassword).then filterInvalid

  # token-based password reset, with expiration date
  else if resetPassword?
    unless _.isNumber(resetPassword)
      return error_.bundle req, res, 'invalid resetPassword timestamp', 500
    test = testOpenResetPasswordWindow(resetPassword)

  unless test?
    # it is a resetPassword request but without a valid reset
    return error_.bundle req, res, 'reset password token expired: request a new token', 403

  test
  .then updatePassword.bind(null, user, newPassword)
  .then _.Ok(res)
  .catch error_.Handler(req, res)

updatePassword = (user, newPassword)->
  pw_.hash newPassword
  .then updateUserPassword.bind(null, user._id, user)

verifyCurrentPassword = (user, currentPassword)->
  pw_.verify user.password, currentPassword

filterInvalid = (isValid)->
  unless isValid
    throw error_.new 'invalid newPassword', 400

updateUserPassword = (userId, user, newHash)->
  user_.db.update userId, User.updatePassword.bind(null, user, newHash)

testOpenResetPasswordWindow = (resetPassword)->
  if _.expired resetPassword, oneHour
    error_.reject 'reset password timespan experied', 400
  else
    promises_.resolved
