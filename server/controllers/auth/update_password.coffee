CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
pw_ = __.require('lib', 'crypto').passwords

module.exports = (req, res, next)->
  {user, body} = req
  {currentPassword, newPassword} = body
  userId = user._id

  _.types [currentPassword, newPassword, userId], 'strings...'

  unless User.tests.password(currentPassword)
    return _.errorHandler res, 'invalid currentPassword', 400

  unless User.tests.password(newPassword)
    return _.errorHandler res, 'invalid newPassword', 400


  verifyCurrentPassword(user, currentPassword)
  .then filterInvalid
  .then -> hashNewPassword(newPassword)
  .then updateUserPassword.bind(null, userId, user)
  .then -> res.send('ok')
  .catch (err)->
    _.errorHandler res, err, err.status




verifyCurrentPassword = (user, currentPassword)->
  pw_.verify user.password, currentPassword

filterInvalid = (isValid)->
  unless isValid
    err = new Error 'invalid newPassword'
    err.status = 400
    throw err

hashNewPassword = (newPassword)->
  pw_.hash(newPassword)

updateUserPassword = (userId, user, newHash)->
  user_.db.update userId, updateFn.bind(null, user, newHash)

updateFn = (user, newHash)->
  user.password = newHash
  return user

