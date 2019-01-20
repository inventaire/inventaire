__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
responses_ = __.require 'lib', 'responses'
parameters = require './parameters'
{ generics } = parameters

module.exports = (req, res, configs)->
  Promise.try ->
    assert_.object req.query

    place = getPlace req.method
    input = _.cloneDeep req[place]
    delete input.action

    unless _.isPlainObject input
      type = _.typeOf input
      throw error_.new "#{place} should be an object, got #{type}", 400

    for name of input
      removeUnexpectedParameter input, name, configs, res

    for name, config of configs
      sanitizeParameter input, name, config, place, res

    if req.user?._id? then input.reqUserId = req.user._id

    return input

sanitizeParameter = (input, name, config, place, res)->
  { generic } = config
  parameter = if generic? then generics[generic] else parameters[name]

  unless parameter?
    addWarning res, "unexpected config parameter: #{name}"
    delete input[name]
    return

  unless input[name]? then applyDefaultValue input, name, config, parameter
  unless input[name]?
    if config.optional then return
    else throw error_.newMissing place, name

  format input, name, parameter.format, config

  # May throw a custom error, to avoid getting the general error
  # created hereafter
  unless parameter.validate input[name], name, config
    err = error_.newInvalid name, input[name]
    obfuscateSecret parameter, err
    throw err

  enforceBoundaries input, name, config, parameter, res

  renameParameter input, name, _.camelCase
  renameParameter input, name, parameter.rename

  return

getPlace = (method)->
  if method is 'POST' or method is 'PUT' then 'body' else 'query'

removeUnexpectedParameter = (input, name, configs, res)->
  unless configs[name]?
    addWarning res, "unexpected parameter: #{name}"
    delete input[name]

format = (input, name, formatFn, config)->
  if formatFn? then input[name] = formatFn input[name], name, config

applyDefaultValue = (input, name, config, parameter)->
  if config.default? then input[name] = config.default
  else if parameter.default? then input[name] = parameter.default

obfuscateSecret = (parameter, err)->
  if parameter.secret then err.context.value = _.obfuscate err.context.value

enforceBoundaries = (input, name, config, parameter, res)->
  min = config.min or parameter.min
  max = config.max or parameter.max
  if min? and input[name] < min
    enforceBoundary input, name, min, res, 'under'
  else if max? and input[name] > max
    enforceBoundary input, name, max, res, 'over'

enforceBoundary = (input, name, boundary, res, position)->
  input[name] = boundary
  addWarning res, "#{name} can't be #{position} #{boundary}"

renameParameter = (input, name, renameFn)->
  unless renameFn? then return
  aliasedName = renameFn name
  input[aliasedName] = input[name]

addWarning = (res, message)->
  _.warn message
  responses_.addWarning res, 'parameters', message
