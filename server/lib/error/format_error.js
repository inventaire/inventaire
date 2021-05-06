// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { serverMode } = require('config')
// This flag can't rely on the CONFIG.env, as it's main use case is for error reported by mocha,
// and mocha is sometimes called directly, without giving the chance to set NODE_ENV
const errContextMightNotBeLogged = serverMode !== true

// Using minimal dependencies to avoid circular dependencies
// as this is depended on by lib/error which is called very early
const { isNumber, isPlainObject, flatten, compact } = require('lodash')

// Global conventions:
// - all error objects should have a statusCode (mimicking HTTP status codes)
//   this is already the case for errors rejected by the lib blue-cot and server/lib/requests

module.exports = (err, filter, ...context) => {
  // numbers filters are used as HTTP codes
  // while string will be taken as a type
  const attribute = isNumber(filter) ? 'statusCode' : 'type'
  err[attribute] = filter

  // context arguments prefered format is a single object (possibly with data
  // the client can depend on) but there are still exceptions
  context = compact(flatten(context))
  if (context.length === 1 && isPlainObject(context[0])) {
    context = context[0]
  }

  err.context = context
  err.emitter = getErrorEmittingLines(err)

  if (errContextMightNotBeLogged) {
    err.stack += `\nContext: ${JSON.stringify(err.context)}`
  }

  return err
}

const getErrorEmittingLines = err => {
  return err.stack.split('\n')
  .filter(line => !line.match(/lib\/error/))
  .slice(0, 5)
  .map(getErrorEmittingLine)
}

const getErrorEmittingLine = line => {
  if (!line) return
  return line
  .trim()
  .replace(/^\s*at\s+/, '')
  // delete parenthesis around the file path
  .replace(/(\(|\))/g, '')
  // delete machine specific path
  .replace(/[a-z_/]+server/, ': server')
  .replace(/[a-z_/]+node_modules/, ': node_modules')
  // identify anonymous functions
  .replace(/^:/, '(anonymous):')
}
