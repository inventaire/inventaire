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

  getByScore: ->
    nonAuthReq 'get', "#{endpoint}by-score&limit=1000"
    .get 'tasks'

  update: (id, attribute, value)->
    adminReq 'put', '/api/tasks?action=update', { id, attribute, value }
