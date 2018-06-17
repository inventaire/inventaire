CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'

cspReport = (req, res)->
  { 'csp-report':errData } = req.body

  unless errData?
    return error_.bundleMissingBody req, res, 'csp-report'

  err = buildError 'csp report', 'csp', errData, req
  _.error err, 'csp report', false
  responses_.ok res

errorReport = (req, res)->
  { error:errData } = req.body

  unless errData?
    return error_.bundleMissingBody req, res, 'error'

  message = errData.message or 'client error'

  err = buildError message, 'client error report', errData, req
  _.error err, 'client error report'
  responses_.ok res

buildError = (message, labels, errData, req)->
  context = _.omit errData, 'stack'
  statusCode = errData.statusCode or 500
  err = error_.new message, statusCode, context
  # Do not add an emitter stack on client reports as it makes it be confused
  # with the client error stack itself
  delete err.emitter
  # Labels to be used by gitlab-logging
  err.labels = labels
  err.stack = getErrStack errData
  err.referer = req.headers.referer
  err['user-agent'] = req.headers['user-agent']
  return err

# Faking an error object for the needs of server/lib/utils/open_issue.coffee
# Define the stack first to stringify only what was reported
getErrStack = (err)->
  { message, stack } = err
  stack = err.stack or JSON.stringify err, null, 2
  # Adding the message at the top of the stack trace
  # as expected by _.error that will log only the stack trace, assuming it
  # contains the error message too
  if _.isNonEmptyString(message) and stack.search(message) is -1
    stack = message + '\n' + stack
  return stack

module.exports =
  post: ActionsControllers
    public:
      'csp-report':  cspReport
      'error-report':  errorReport
      'online': require './online_report'
