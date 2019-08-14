__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
createEntity = require './lib/create_entity'
getEntityByUri = require './lib/get_entity_by_uri'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  labels:
    generic: 'object'
    default: {}
  claims:
    generic: 'object'

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { labels, claims, reqUserId } = params
    return createEntity labels, claims, reqUserId
  # Re-request the entity's data to get it formatted
  .then (entity)-> getEntityByUri { uri: "inv:#{entity._id}", refresh: true }
  .then responses_.Send(res)
  .then Track(req, ['entity', 'creation'])
  .catch error_.Handler(req, res)
