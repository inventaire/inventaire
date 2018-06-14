__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
parameters = require './parameters'
{ generics } = parameters

module.exports = (req, res, configs)->
  Promise.try ->
    _.type req.query, 'object'

    place = getPlace req.method
    input = _.cloneDeep req[place]
    delete input.action

    for name of input
      removeUnexpectedParameter input, name, configs, res

    for name, config of configs
      sanitizeParameter input, name, config, place, res

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

  enforceMaximum input, name, config.max, res

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

enforceMaximum = (input, name, max, res)->
  if max? and input[name] > max
    input[name] = max
    addWarning res, "#{name} can't be over #{max}"

renameParameter = (input, name, renameFn)->
  unless renameFn? then return
  aliasedName = renameFn name
  input[aliasedName] = input[name]

addWarning = (res, message)->
  _.warn message
  responses_.addWarning res, 'parameters', message
