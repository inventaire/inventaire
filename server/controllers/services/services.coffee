__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    public:
      'email-validation': require './email_validation'
