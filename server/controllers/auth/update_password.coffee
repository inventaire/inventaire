CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
pw_ = __.require('lib', 'crypto').passwords

module.exports = (req, res, next)->
  {user, body} = req
  {currentPassword, newPassword} = body
  userId = user._id

  _.types [currentPassword, newPassword, userId], 'strings...'

  unless User.tests.password(currentPassword)
    return error_.bundle res, 'invalid currentPassword', 400

  unless User.tests.password(newPassword)
    return error_.bundle res, 'invalid newPassword', 400


  verifyCurrentPassword(user, currentPassword)
  .then filterInvalid
  .then -> hashNewPassword(newPassword)
  .then updateUserPassword.bind(null, userId, user)
  .then -> res.send('ok')
  .catch error_.Handler(res)


verifyCurrentPassword = (user, currentPassword)->
  pw_.verify user.password, currentPassword

filterInvalid = (isValid)->
  unless isValid
    throw error_.new 'invalid newPassword', 400

hashNewPassword = (newPassword)->
  pw_.hash(newPassword)

updateUserPassword = (userId, user, newHash)->
  user_.db.update userId, updateFn.bind(null, user, newHash)

updateFn = (user, newHash)->
  user.password = newHash
  return user

