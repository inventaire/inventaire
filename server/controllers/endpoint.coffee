CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
validateObject = __.require 'lib', 'validate_object'
validEndpointKeys = [ 'get', 'post', 'put', 'delete', 'all' ]

# Basic validation of controllers objects to ease debugging
module.exports = (path)->
  obj = __.require 'controllers', path

  try validateObject obj, validEndpointKeys, 'function'
  catch err
    _.log path, 'endpoint validation failed', 'red'
    # Let the error crash americano to prevent the server from starting
    # and make clear something needs to be fixed
    throw err

  return obj
