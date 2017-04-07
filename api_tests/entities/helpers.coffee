CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = __.require 'apiTests', 'utils/utils'

module.exports =
  ensureEntityExist: (uri, data)->
    authReq 'get', "/api/entities?action=by-uris&uris=#{uri}"
    .get 'entities'
    .then (entities)->
      if entities[uri]? then return entities[uri]
      authReq 'post', '/api/entities?action=create', data
