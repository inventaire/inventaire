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
      unless configs[name]?
        addWarning res, "unexpected parameter: #{name}"
        delete input[name]

    for name, config of configs
      sanitizeParameter input, name, config, place, res

    return input

sanitizeParameter = (input, name, config, place, res)->
  parameter = if config.generic? then generics[config.generic] else parameters[name]

  unless parameter?
    addWarning res, "unexpected config parameter: #{name}"
    delete input[name]
    return

  unless input[name]?
    if config.default? then input[name] = config.default
    else if parameter.default? then input[name] = parameter.default
    else if config.optional then return
    else throw error_.newMissing place, name

  if parameter.format?
    input[name] = parameter.format input[name], name, config

  # May throw a custom error, to avoid getting the general error
  # created hereafter
  unless parameter.validate input[name], name, config
    err = error_.newInvalid name, input[name]
    if parameter.secret then err.context.value = _.obfuscate err.context.value
    throw err

  if config.max? and input[name] > config.max
    input[name] = config.max
    addWarning res, "#{name} should be below or equal to #{config.max}"

  # Also make the parameter available from its camel-cased name
  camelCasedName = _.camelCase name
  input[camelCasedName] = input[name]

  if parameter.altKey?
    parameterAltKey = parameter.altKey camelCasedName
    input[parameterAltKey] = input[name]

  return

getPlace = (method)->
  if method is 'POST' or method is 'PUT' then 'body' else 'query'

addWarning = (res, message)->
  _.warn message
  responses_.addWarning res, 'parameters', message
