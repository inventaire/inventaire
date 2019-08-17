__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
getEntityByUri = require './lib/get_entity_by_uri'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  labels:
    generic: 'object'
    default: {}
  claims:
    generic: 'object'
  prefix:
    whitelist: [ 'inv', 'wd' ]
    default: 'inv'

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { prefix, labels, claims, reqUserId } = params
    createFn = creators[prefix]
    params = { labels, claims }
    if prefix is 'wd' then params.user = req.user
    else params.userId = reqUserId
    createFn params
    .then (entity)->
      # Re-request the entity's data to get it formatted
      getEntityByUri { uri: entity.uri, refresh: true }
  .then responses_.Send(res)
  .then Track(req, [ 'entity', 'creation' ])
  .catch error_.Handler(req, res)

creators =
  inv: require './lib/create_inv_entity'
  wd: require './lib/create_wd_entity'
