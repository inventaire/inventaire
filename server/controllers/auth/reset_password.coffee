CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'
user_ = __.require 'controllers', 'user/lib/user'
isValidEmail = __.require('models', 'validations/user').email

sanitization =
  email: {}

module.exports = (req, res, next)->
  sanitize req, res, sanitization
  .then (params)-> user_.findOneByEmail params.email
  .catch (err)->
    if err.statusCode is 404
      throw error_.new 'email not found', 400, email
    else
      throw err
  .then user_.sendResetPasswordEmail
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)
