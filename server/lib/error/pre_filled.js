// Pre-formatted error handlers to make error responses consistent
const { pick } = require('lodash')
const { typeOf } = require('../utils/base')

module.exports = error_ => {
  const newFunctions = {
    // A standardized way to return a 400 missing parameter
    // either in the request query or body
    newMissing: (place, parameter) => {
      // Allow to pass several possible parameters separated by pipes
      // Ex: 'user|username'
      parameter = parameter.split('|').join(' or ')
      const message = `missing parameter in ${place}: ${parameter}`
      const err = error_.new(message, 400)
      err.attachReqContext = place
      err.error_type = 'missing_parameter'
      err.error_name = `missing_${parameter}`
      return err
    },

    // A standardized way to return a 400 invalid parameter
    newInvalid: (parameter, value) => {
      const type = typeOf(value)
      const context = { parameter, value, type }
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : value
      const err = error_.new(`invalid ${parameter}: ${valueStr}`, 400, context)
      err.error_type = 'invalid_parameter'
      err.error_name = `invalid_${parameter}`
      return err
    }
  }

  newFunctions.newMissingQuery = newFunctions.newMissing.bind(null, 'query')
  newFunctions.newMissingBody = newFunctions.newMissing.bind(null, 'body')

  // Allow to use the standard error_.new interface
  // while out or at the end of a promise chain
  // DO NOT use inside a promise chain as error_.handler
  // send res, which, if there is an error, should be done by the final .catch
  const Bundle = newFnName => (req, res, ...args) => {
    // First create the new error
    const err = error_[newFnName].apply(null, args)
    // then make the handler deal with the res object
    return error_.handler(req, res, err)
  }

  const bundles = {
    bundle: Bundle('new'),
    bundleMissingQuery: Bundle('newMissingQuery'),
    bundleMissingBody: Bundle('newMissingBody'),
    bundleInvalid: Bundle('newInvalid'),

    unauthorizedApiAccess: (req, res, context) => {
      return error_.bundle(req, res, 'unauthorized api access', 401, context)
    },

    unauthorizedAdminApiAccess: (req, res, context) => {
      return error_.bundle(req, res, 'unauthorized admin api access', 403, context)
    },

    // A standardized way to return a 400 unknown action
    unknownAction: (req, res, context) => {
      if (context == null) {
        context = pick(req, [ 'method', 'query', 'body' ])
        context.url = req.originalUrl
      }
      return error_.bundle(req, res, 'unknown action', 400, context)
    }
  }

  return Object.assign(newFunctions, bundles)
}
