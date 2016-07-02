CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
testEmail = __.require('models', 'tests/user').email
# pw_ = __.require('lib', 'crypto').passwords

module.exports = (req, res, next)->
  { email } = req.body
  unless email? then return error_.bundle req, res, 'no email provided', 400
  unless testEmail(email) then return error_.bundle req, res, 'invalid email', 400

  user_.findOneByEmail email
  .catch (err)-> throw error_.complete err, 400, email
  .then user_.sendResetPasswordEmail
  .then _.Ok(res)
  .catch error_.Handler(req, res)
