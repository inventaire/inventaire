CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
User = __.require 'models', 'user'
pw_ = __.require('lib', 'crypto').passwords
{ oneHour } =  __.require 'lib', 'times'

module.exports = (req, res, next)->
  { user, body } = req
  { 'current-password':currentPassword, 'new-password':newPassword } = body
  { resetPassword } = user

  unless User.validations.password newPassword
    return error_.bundleInvalid req, res, 'new-password', newPassword

  # classic password update
  if currentPassword?
    unless User.validations.password currentPassword
      return error_.bundleInvalid req, res, 'current-password', currentPassword
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
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)

updatePassword = (user, newPassword)->
  pw_.hash newPassword
  .then updateUserPassword.bind(null, user._id, user)

verifyCurrentPassword = (user, currentPassword)->
  pw_.verify user.password, currentPassword

filterInvalid = (isValid)->
  unless isValid then throw error_.newInvalid 'new-password'

updateUserPassword = (userId, user, newHash)->
  user_.db.update userId, User.updatePassword.bind(null, user, newHash)

testOpenResetPasswordWindow = (resetPassword)->
  if _.expired resetPassword, oneHour
    error_.reject 'reset password timespan experied', 400
  else
    promises_.resolved
