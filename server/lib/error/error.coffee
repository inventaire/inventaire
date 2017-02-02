__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
formatError = require './format_error'

module.exports = error_ = {}

# help bundling information at error instanciation
# so that it can be catched and parsed in a standardized way
# at the end of a promise chain, typically by a .catch error_.Handler(req, res)
error_.new = (message, filter, context...)->
  _.types [message, filter], ['string', 'string|number']
  err = new Error message
  return formatError err, filter, context

# completing an existing error object
error_.complete = (err, filter, context...)->
  _.types [err, filter], ['object', 'string|number']
  return formatError err, filter, context

# same as error_.new but returns a promise
# also accepts Error instances
error_.reject = (args...)->
  method = if args[0] instanceof Error then 'complete' else 'new'
  err = error_[method].apply null, args
  return promises_.reject(err)

# allow to use the standard error_.new interface
# while out or at the end of a promise chain
# DO NOT use inside a promise chain as error_.handler
# send res, which, if there is an error, should be done by the final .catch
error_.bundle = (req, res, args...)->
  # first create the new error
  err = error_.new.apply null, args
  # then make the handler deal with the res object
  error_.handler req, res, err

# a standardized way to return a 400 unknown action
# on controllers top level switches
error_.unknownAction = (req, res, context)->
  context or= _.pick req, [ 'originalUrl', 'body', 'headers' ]
  error_.bundle req, res, 'unknown action', 400, context

error_.handler = errorHandler = require './error_handler'

# error_.handler with a binded res object
# to be used in final promise chains like so:
# .catch error_.Handler(req, res)
error_.Handler = (req, res)-> errorHandler.bind null, req, res

error_.notFound = (context)->
  err = error_.new 'not found', 404, context
  err.notFound = true
  return err

error_.catchNotFound = (err)->
  if err?.notFound then return
  else throw err
