CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
testEmail = __.require('models', 'tests/user').email
# pw_ = __.require('lib', 'crypto').passwords

module.exports = (req, res, next)->
  {email} = req.body
  unless email? then return error_.bundle res, 'no email provided', 400
  unless testEmail(email) then return error_.bundle res, 'invalid email', 400

  user_.findOneByEmail(email)
  .then user_.sendResetPasswordEmail
  .then -> res.send('ok')
  .catch error_.Handler(res)
