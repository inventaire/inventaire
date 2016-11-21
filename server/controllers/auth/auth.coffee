__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
{ signup, login, logout } = require './connection'
{ usernameAvailability, emailAvailability } = require './availability'

module.exports =
  publicActions: ActionsControllers
    'signup': signup
    'login': login
    'logout': logout
    'username-availability': usernameAvailability
    'email-availability': emailAvailability
    'reset-password': require './reset_password'
    'submit': require './fake_submit'

  actions: ActionsControllers
    'email-confirmation': require './email_confirmation'
    'update-password': require './update_password'

  token: require './token'
