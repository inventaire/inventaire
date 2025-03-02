import { assertString, assertObject } from '#lib/utils/assert_types'
import type { Req } from '#types/server'
import { formatContextualizedError, type ContextualizedError, type ErrorContext } from './format_error.js'

type ErrorClass = typeof Error

// help bundling information at error instanciation
// so that it can be catched and parsed in a standardized way
// at the end of a promise chain, typically by a .catch errorHandler(req, res)
export function newError (message: string, filter: number | string, context?: ErrorContext, Err: ErrorClass = Error) {
  const err = new Err(message)
  return formatContextualizedError(err, filter, context)
}

export function addErrorContext (err: ContextualizedError, additionalContext: ErrorContext) {
  err.context ??= {}
  Object.assign(err.context, additionalContext)
  return err
}

export function notFoundError (context: ErrorContext) {
  const err = newError('not found', 404, context)
  err.notFound = true
  return err
}

export function unauthorizedError (req: Req, message: string, context: ErrorContext) {
  assertObject(req)
  assertString(message)
  // If the requested is authentified, its a forbidden access
  // If not, the requested might be fullfilled after authentification
  const statusCode = 'user' in req ? 403 : 401
  return newError(message, statusCode, context)
}

export function catchNotFound (err: ContextualizedError) {
  // notFound flag is set by: levelup, notFoundError
  if (err && (err.notFound || err.statusCode === 404)) return
  throw err
}

export function addContextToStack (err: ContextualizedError) {
  if (err.context) err.stack += `\n[Context] ${JSON.stringify(err.context)}`
}
