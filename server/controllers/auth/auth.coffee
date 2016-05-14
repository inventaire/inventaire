CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
passport_ = __.require 'lib', 'passport/passport'

{ signup, login, logout } = require './connection'
{ usernameAvailability, emailAvailability } = require './availability'
emailConfirmation = require './email_confirmation'
updatePassword = require './update_password'
resetPassword = require './reset_password'
fakeSubmit = require './fake_submit'

exports.publicActions = (req, res, next)->
  { action } = req.query
  switch action
    when 'signup' then signup req, res
    when 'login' then login req, res
    when 'logout' then logout req, res
    when 'username-availability' then usernameAvailability req, res
    when 'email-availability' then emailAvailability req, res
    when 'reset-password' then resetPassword req, res
    when 'submit' then fakeSubmit req, res
    else error_.unknownAction res

exports.actions = (req, res, next)->
  { action } = req.query
  switch action
    when 'email-confirmation' then emailConfirmation req, res
    when 'update-password' then updatePassword req, res
    else error_.unknownAction res

exports.token = require './token'
