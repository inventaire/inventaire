// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const responses_ = __.require('lib', 'responses')
const parameters = require('./parameters')
const { generics } = parameters

module.exports = (req, res, configs) => Promise.try(() => {
  let name
  assert_.object(req.query)

  const place = getPlace(req.method)
  const input = _.cloneDeep(req[place])
  delete input.action

  if (!_.isPlainObject(input)) {
    const type = _.typeOf(input)
    throw error_.new(`${place} should be an object, got ${type}`, 400)
  }

  for (name in input) {
    removeUnexpectedParameter(input, name, configs, res)
  }

  for (name in configs) {
    const config = configs[name]
    sanitizeParameter(input, name, config, place, res)
  }

  if ((req.user != null ? req.user._id : undefined) != null) { input.reqUserId = req.user._id }

  return input
})

var sanitizeParameter = function(input, name, config, place, res){
  const { generic } = config
  const parameter = (generic != null) ? generics[generic] : parameters[name]

  if (parameter == null) {
    if (generic != null) {
      throw error_.new('invalid generic name', 500, { generic })
    } else {
      addWarning(res, `unexpected config parameter: ${name}`)
      delete input[name]
      return
    }
  }

  if (input[name] == null) { applyDefaultValue(input, name, config, parameter) }
  if (input[name] == null) {
    if (config.optional) { return
    } else { throw error_.newMissing(place, name) }
  }

  format(input, name, parameter.format, config)

  // May throw a custom error, to avoid getting the general error
  // created hereafter
  if (!parameter.validate(input[name], name, config)) {
    const err = error_.newInvalid(name, input[name])
    obfuscateSecret(parameter, err)
    throw err
  }

  enforceBoundaries(input, name, config, parameter, res)

  renameParameter(input, name, _.camelCase)
  renameParameter(input, name, parameter.rename)

}

var getPlace = function(method){
  if ((method === 'POST') || (method === 'PUT')) return 'body'
  else return 'query'
}

var removeUnexpectedParameter = function(input, name, configs, res){
  if (configs[name] == null) {
    addWarning(res, `unexpected parameter: ${name}`)
    return delete input[name]
  }
}

var format = function(input, name, formatFn, config){
  if (formatFn != null) return input[name] = formatFn(input[name], name, config)
}

var applyDefaultValue = function(input, name, config, parameter){
  if (config.default != null) { return input[name] = _.cloneDeep(config.default)
  } else if (parameter.default != null) { return input[name] = _.cloneDeep(parameter.default) }
}

var obfuscateSecret = function(parameter, err){
  if (parameter.secret) return err.context.value = _.obfuscate(err.context.value)
}

var enforceBoundaries = function(input, name, config, parameter, res){
  const min = config.min || parameter.min
  const max = config.max || parameter.max
  if ((min != null) && (input[name] < min)) {
    return enforceBoundary(input, name, min, res, 'under')
  } else if ((max != null) && (input[name] > max)) {
    return enforceBoundary(input, name, max, res, 'over')
  }
}

var enforceBoundary = function(input, name, boundary, res, position){
  input[name] = boundary
  return addWarning(res, `${name} can't be ${position} ${boundary}`)
}

var renameParameter = function(input, name, renameFn){
  if (renameFn == null) return
  const aliasedName = renameFn(name)
  return input[aliasedName] = input[name]
}

var addWarning = function(res, message){
  _.warn(message)
  return responses_.addWarning(res, 'parameters', message)
}
