CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ nonAuthReq, adminReq } = require './utils'
endpoint = '/api/tasks?action='

module.exports =
  getByIds: (ids)->
    ids = _.forceArray(ids).join '|'
    nonAuthReq 'get', "#{endpoint}by-ids&ids=#{ids}"
    .get 'tasks'

  getBySuspectUri: (uri)->
    nonAuthReq 'get', "#{endpoint}by-suspect-uri&uri=#{uri}"
    .get 'tasks'

  getByScore: (options = {})->
    url = "#{endpoint}by-score"
    { limit, offset } = options
    if limit? then url += "&limit=#{limit}"
    if offset? then url += "&offset=#{offset}"
    nonAuthReq 'get', url
    .get 'tasks'

  update: (id, attribute, value)->
    adminReq 'put', "#{endpoint}update", { id, attribute, value }

  checkEntities: (uris)->
    uris = _.forceArray uris
    adminReq 'post', "#{endpoint}check-entities", { uris }
    .get 'tasks'

  collectEntities: -> adminReq 'post', "#{endpoint}collect-entities"
