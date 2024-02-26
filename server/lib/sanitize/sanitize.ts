import { camelCase, cloneDeep, isPlainObject } from 'lodash-es'
import { newError } from '#lib/error/error'
import { newMissingError, newInvalidError } from '#lib/error/pre_filled'
import { addWarning } from '#lib/responses'
import { assert_ } from '#lib/utils/assert_types'
import { obfuscate } from '#lib/utils/base'
import { typeOf } from '#lib/utils/types'
import parameters from './parameters.js'

const { generics } = parameters

// The sanitize function doesn't need to be async
// but has been used that way to be able to start promise chains
// There are some cases though where async is a problem, namely
// when something needs to be done during the current tick.
// Example: consumers of the request (aka req) stream need to run on the same tick.
// If they have to wait for the next tick, 'data' events might be over
export const sanitize = (req, res, configs) => {
  assert_.object(req.query)

  const place = getPlace(req.method, configs)
  const input = cloneDeep(req[place])
  delete input.action

  if (!isPlainObject(input)) {
    const type = typeOf(input)
    throw newError(`${place} should be an object, got ${type}`, 400)
  }

  for (const name in input) {
    removeUnexpectedParameter(input, name, configs, res)
  }

  for (const name in configs) {
    if (!optionsNames.has(name)) {
      const config = configs[name]
      sanitizeParameter(input, name, config, place, res)
    }
  }

  if (req.user) {
    input.reqUserId = req.user._id
  }

  return input
}

const optionsNames = new Set([ 'nonJsonBody' ])

const sanitizeParameter = (input, name, config, place, res) => {
  const parameter = getParameterFunctions(name, config.generic)

  if (parameter.drop) {
    delete input[name]
    return
  }

  if (input[name] == null) applyDefaultValue(input, name, config, parameter)
  if (input[name] == null) {
    if (config.canBeNull && input[name] === null) return
    else if (config.optional) return
    else throw newMissingError(place, name)
  }

  format(input, name, parameter.format, config)

  // May throw a custom error, to avoid getting the general error
  // created hereafter
  if (!parameter.validate(input[name], name, config)) {
    const err = newInvalidError(name, input[name])
    obfuscateSecret(parameter, err)
    throw err
  }

  enforceBoundaries(input, name, config, parameter, res)

  renameParameter(input, name, camelCase)
  renameParameter(input, name, parameter.rename)
}

const getParameterFunctions = (name, generic) => {
  let parameter
  if (generic) {
    parameter = generics[generic]
  } else if (prefixedParameterPattern.test(name)) {
    const unprefixedName = name.replace(prefixedParameterPattern, '')
    parameter = parameters[unprefixedName]
  } else {
    parameter = parameters[name]
  }
  return parameter
}

export const validateSanitization = configs => {
  for (const name in configs) {
    if (!optionsNames.has(name)) {
      const config = configs[name]
      validateSanitizationParameter(name, config)
    }
  }
  return configs
}

const validateSanitizationParameter = (name, config) => {
  const { generic } = config
  const parameter = getParameterFunctions(name, generic)
  if (parameter == null) {
    if (generic) {
      throw newError('invalid generic name', 500, { name, generic })
    } else {
      throw newError('invalid parameter name', 500, { name })
    }
  }
}

const prefixedParameterPattern = /^(old|new|current)-/

const getPlace = (method, configs) => {
  let place = 'query'
  if (method === 'POST' || method === 'PUT') {
    if (!configs.nonJsonBody) place = 'body'
  }
  return place
}

const removeUnexpectedParameter = (input, name, configs, res) => {
  if (configs[name] == null) {
    addWarning(res, `unexpected parameter: ${name}`)
    delete input[name]
  }
}

const format = (input, name, formatFn, config) => {
  if (!formatFn) return
  try {
    input[name] = formatFn(input[name], name, config)
  } catch (err) {
    const formatError = newError('could not format input', 500, { input, name, formatFn, config })
    formatError.cause = err
    throw formatError
  }
}

const applyDefaultValue = (input, name, config, parameter) => {
  // Accept 'null' as a default value
  if (config.default !== undefined) {
    input[name] = cloneDeep(config.default)
  } else if (parameter.default !== undefined) {
    input[name] = cloneDeep(parameter.default)
  }
}

const obfuscateSecret = (parameter, err) => {
  if (parameter.secret && typeof err.context.value === 'string') {
    err.context.value = obfuscate(err.context.value)
  }
}

const enforceBoundaries = (input, name, config, parameter, res) => {
  const min = config.min || parameter.min
  const max = config.max || parameter.max
  if (min != null && input[name] < min) {
    enforceBoundary(input, name, min, res, 'under')
  } else if (max != null && input[name] > max) {
    enforceBoundary(input, name, max, res, 'over')
  }
}

const enforceBoundary = (input, name, boundary, res, position) => {
  input[name] = boundary
  addWarning(res, `${name} can't be ${position} ${boundary}`)
}

const renameParameter = (input, name, renameFn) => {
  if (renameFn == null) return
  const aliasedName = renameFn(name)
  input[aliasedName] = input[name]
}
