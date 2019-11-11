// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let error_, errorHandler
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const formatError = require('./format_error')

module.exports = (error_ = {})

// help bundling information at error instanciation
// so that it can be catched and parsed in a standardized way
// at the end of a promise chain, typically by a .catch error_.Handler(req, res)
error_.new = function(message, filter, ...context){
  assert_.types([ 'string', 'string|number' ], [ message, filter ])
  const err = new Error(message)
  return formatError(err, filter, context)
}

// Completing an existing error object
error_.complete = function(err, filter, ...context){
  assert_.types([ 'object', 'string|number' ], [ err, filter ])
  return formatError(err, filter, context)
}

// Compelete and rethrow: to be used in a promise chain
error_.Complete = (...args) => (function(err) {
  throw error_.complete.apply(null, [ err ].concat(args))
})

error_.handler = (errorHandler = require('./error_handler'))

// error_.handler with a binded res object
// to be used in final promise chains like so:
// .catch error_.Handler(req, res)
error_.Handler = (req, res) => errorHandler.bind(null, req, res)

error_.notFound = function(context){
  const err = error_.new('not found', 404, context)
  err.notFound = true
  return err
}

error_.catchNotFound = function(err){
  if (err != null ? err.notFound : undefined) { return
  } else { throw err }
}

_.extend(error_, require('./pre_filled')(error_))
