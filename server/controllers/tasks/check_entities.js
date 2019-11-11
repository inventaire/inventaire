CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
checkEntity = require './lib/check_entity'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  uris: {}

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { uris } = params
    return Promise.all uris.map(checkEntity)
  .then _.flatten
  .then responses_.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)
