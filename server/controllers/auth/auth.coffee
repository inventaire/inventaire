CONFIG = require 'config'
__ = CONFIG.root
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
  {action} = req.query
  switch action
    when 'signup' then signup(req, res, next)
    when 'login' then login(req, res, next)
    when 'logout' then logout(req, res, next)
    when 'username-availability' then usernameAvailability(req, res, next)
    when 'email-availability' then emailAvailability(req, res, next)
    when 'reset-password' then resetPassword(req, res, next)
    when 'submit' then fakeSubmit(req, res, next)
    else error_.bundle res, 'unknown auth action', 400

exports.actions = (req, res, next)->
  {action} = req.query
  switch action
    when 'email-confirmation' then emailConfirmation(req, res, next)
    when 'update-password' then updatePassword(req, res, next)
    else error_.bundle res, 'unknown auth action', 400

exports.token = require './token'
