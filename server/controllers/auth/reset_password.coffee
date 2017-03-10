CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'controllers', 'user/lib/user'
testEmail = __.require('models', 'tests/user').email
# pw_ = __.require('lib', 'crypto').passwords

module.exports = (req, res, next)->
  { email } = req.body
  unless email? then return error_.bundleMissingBody req, res, 'email'
  unless testEmail email
    return error_.bundleInvalid req, res, 'email', email

  user_.findOneByEmail email
  .catch (err)->
    if err.statusCode is 404
      throw error_.new 'email not found', 400, email
    else
      throw err
  .then user_.sendResetPasswordEmail
  .then _.Ok(res)
  .catch error_.Handler(req, res)
