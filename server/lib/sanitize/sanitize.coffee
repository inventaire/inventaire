__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
parameters = require './parameters'

module.exports = (req, res, configs)->
  Promise.try ->
    _.type req.query, 'object'

    input = _.extend {}, req.query, req.body
    delete input.action

    place = getPlace req.method

    for name, value of input
      unless configs[name]?
        addWarning res, "unexpected parameter: #{name}"
        delete input[name]

    for name, config of configs
      parameter = parameters[name]

      unless parameter?
        addWarning res, "unexpected parameter: #{name}"
        delete input[name]

      unless input[name]?
        if config.default? then input[name] = config.default
        else throw error_.newMissing place, name

      if parameter.format?
        input[name] = parameter.format input[name]

      unless parameter.validate input[name]
        throw error_.newInvalid name, input[name]

      if config.max? and input[name] > config.max
        input[name] = config.max
        addWarning res, "#{name} should be below or equal to #{config.max}"

    return input

getPlace = (method)->
  if method is 'POST' or method is 'PUT' then return 'query or body'
  return 'query'

addWarning = (res, message)-> responses_.addWarning res, 'parameters', message
