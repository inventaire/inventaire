CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'

cspReport = (req, res)->
  { 'csp-report':err } = req.body
  # Faking an error object for the needs of server/lib/utils/open_issue.coffee
  # Define the stack first to stringify only what was reported
  err.stack = JSON.stringify err, null, 2
  err.message = 'csp report'
  err.labels = 'csp'
  _.error err, 'csp report'
  _.ok res

errorReport = (req, res)->
  { error:err } = req.body
  err.labels = 'client'
  _.error err, 'client error report'
  _.ok res

module.exports = ActionsControllers
  'csp-report':  cspReport
  'error-report':  errorReport
  'online': require './online_report'
