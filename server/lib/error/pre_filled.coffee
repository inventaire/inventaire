# Pre-formatted error handlers to make error responses consistent
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
assert_ = __.require 'utils', 'assert_types'

module.exports = (error_)->
  newFunctions =
    # A standardized way to return a 400 missing parameter
    # either in the request query or body
    newMissing: (place, parameter)->
      # Allow to pass several possible parameters separated by pipes
      # Ex: 'user|username'
      parameter = parameter.split('|').join(' or ')
      message = "missing parameter in #{place}: #{parameter}"
      err = error_.new message, 400
      err.attachReqContext = place
      err.error_type = 'missing_parameter'
      err.error_name = "missing_#{parameter}"
      return err

    # A standardized way to return a 400 invalid parameter
    newInvalid: (parameter, value)->
      assert_.string parameter
      context = { parameter, value }
      err = error_.new "invalid #{parameter}: #{value}", 400, context
      err.error_type = 'invalid_parameter'
      err.error_name = "invalid_#{parameter}"
      return err

  newFunctions.newMissingQuery = newFunctions.newMissing.bind null, 'query'
  newFunctions.newMissingBody = newFunctions.newMissing.bind null, 'body'

  # Same as error_.new but returns a promise
  # also accepts Error instances
  Reject = (newFnName)-> (args...)->
    if newFnName is 'new' and args[0] instanceof Error
      # Do NOT assign 'complete' to newFnName
      # as it would have effects on all following reject calls
      currentNewFnName = 'complete'
    else
      currentNewFnName = newFnName

    err = error_[currentNewFnName].apply null, args
    return promises_.reject err

  rejects =
    reject: Reject 'new'
    rejectMissingQuery: Reject 'newMissingQuery'
    rejectInvalid: Reject 'newInvalid'

  # Allow to use the standard error_.new interface
  # while out or at the end of a promise chain
  # DO NOT use inside a promise chain as error_.handler
  # send res, which, if there is an error, should be done by the final .catch
  Bundle = (newFnName)-> (req, res, args...)->
    # First create the new error
    err = error_[newFnName].apply null, args
    # then make the handler deal with the res object
    error_.handler req, res, err

  bundles =
    bundle: Bundle 'new'
    bundleMissingQuery: Bundle 'newMissingQuery'
    bundleMissingBody: Bundle 'newMissingBody'
    bundleInvalid: Bundle 'newInvalid'

    unauthorizedApiAccess: (req, res, context)->
      error_.bundle req, res, 'unauthorized api access', 401, context

    unauthorizedAdminApiAccess: (req, res, context)->
      error_.bundle req, res, 'unauthorized admin api access', 403, context

    # A standardized way to return a 400 unknown action
    unknownAction: (req, res, context)->
      unless context?
        context = _.pick req, [ 'method', 'query', 'body' ]
        context.url = req.originalUrl
      error_.bundle req, res, 'unknown action', 400, context

  return _.extend newFunctions, bundles, rejects
