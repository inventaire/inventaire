CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
User = __.require 'models', 'user'
pw_ = __.require('lib', 'crypto').passwords

module.exports = (req, res, next)->
  {user, body} = req
  {currentPassword, newPassword} = body
  {resetPassword} = user
  userId = user._id

  unless User.tests.password(newPassword)
    return error_.bundle res, 'invalid new password', 400

  # classic password update
  if currentPassword?
    unless User.tests.password(currentPassword)
      return error_.bundle res, 'invalid current password', 400
    test = verifyCurrentPassword(user, currentPassword).then filterInvalid

  # token-based password reset, with expiration date
  else if resetPassword?
    unless _.isNumber(resetPassword)
      return error_.bundle res, 'invalid resetPassword timestamp', 500
    test = testOpenResetPasswordWindow(resetPassword)

  unless test?
    # it is a resetPassword request but without a valid reset
    return error_.bundle res, 'reset password token expired: request a new token', 403


  test
  .then updatePassword.bind(null, res, user, newPassword)
  .catch error_.Handler(res)


updatePassword = (res, user, newPassword)->
  hashNewPassword(newPassword)
  .then updateUserPassword.bind(null, user._id, user)
  .then -> res.send('ok')


verifyCurrentPassword = (user, currentPassword)->
  pw_.verify user.password, currentPassword

filterInvalid = (isValid)->
  unless isValid
    throw error_.new 'invalid newPassword', 400

hashNewPassword = (newPassword)->
  pw_.hash(newPassword)

updateUserPassword = (userId, user, newHash)->
  user_.db.update userId, passwordUpdater.bind(null, user, newHash)

passwordUpdater = (user, newHash)->
  user.password = newHash
  user = _.omit user, 'resetPassword'
  # unlocking password-related functionalities on client-side
  # for browserid users if they ask for a password reset
  if user.creationStrategy is 'browserid'
    user.hasPassword = true
  return user

testOpenResetPasswordWindow = (resetPassword)->
  if _.expired(resetPassword, 3600*1000)
    error_.reject 'reset password timespan experied', 400
  else
    promises_.resolve()
