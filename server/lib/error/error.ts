import errorHandler from '#lib/error/error_handler'
import preFilled from '#lib/error/pre_filled'
import formatError from './format_error.js'

let assert_
const importCircularDependencies = async () => {
  ;({ assert_ } = await import('#lib/utils/assert_types'))
}
setImmediate(importCircularDependencies)

export const error_ = {}

// help bundling information at error instanciation
// so that it can be catched and parsed in a standardized way
// at the end of a promise chain, typically by a .catch error_.Handler(req, res)
error_.new = (message, filter, ...context) => {
  const err = new Error(message)
  return formatError(err, filter, context)
}

// Completing an existing error object
error_.complete = (err, filter, ...context) => formatError(err, filter, context)

// Compelete and rethrow: to be used in a promise chain
error_.Complete = (...args) => err => {
  throw error_.complete.apply(null, [ err ].concat(args))
}

error_.addContext = (err, additionalContext) => {
  err.context = err.context || {}
  Object.assign(err.context, additionalContext)
  return err
}

error_.handler = errorHandler

// error_.handler with a binded res object
// to be used in final promise chains like so:
// .catch error_.Handler(req, res)
error_.Handler = (req, res) => errorHandler.bind(null, req, res)

error_.notFound = context => {
  const err = error_.new('not found', 404, context)
  err.notFound = true
  return err
}

error_.unauthorized = (req, message, context) => {
  assert_.object(req)
  assert_.string(message)
  // If the requested is authentified, its a forbidden access
  // If not, the requested might be fullfilled after authentification
  const statusCode = req.user ? 403 : 401
  return error_.new(message, statusCode, context)
}

export const catchNotFound = err => {
  // notFound flag is set by: levelup, error_.notFound
  if (err && (err.notFound || err.statusCode === 404)) return
  throw err
}

export const addContextToStack = err => {
  if (err.context) err.stack += `\n[Context] ${JSON.stringify(err.context)}`
}

Object.assign(error_, preFilled(error_))
