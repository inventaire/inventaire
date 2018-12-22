__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
assert_ = __.require 'utils', 'assert_types'
formatError = require './format_error'

module.exports = error_ = {}

# help bundling information at error instanciation
# so that it can be catched and parsed in a standardized way
# at the end of a promise chain, typically by a .catch error_.Handler(req, res)
error_.new = (message, filter, context...)->
  assert_.types [ 'string', 'string|number' ], [ message, filter ]
  err = new Error message
  return formatError err, filter, context

# Completing an existing error object
error_.complete = (err, filter, context...)->
  assert_.types [ 'object', 'string|number' ], [ err, filter ]
  return formatError err, filter, context

# Compelete and rethrow: to be used in a promise chain
error_.Complete = (args...)-> (err)->
  throw error_.complete.apply null, [ err ].concat(args)

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

_.extend error_, require('./pre_filled')(error_)
