CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ nonAuthReq, authReq, adminReq } = require './utils'

module.exports = entitiesUtils =
  getByUris: (uris, relatives)->
    if _.isArray(uris) then uris = uris.join('|')
    url = _.buildPath '/api/entities', { action: 'by-uris', uris, relatives }
    nonAuthReq 'get', url

  getByUri: (uri)->
    entitiesUtils.getByUris uri
    .then (res)-> res.entities[uri]

  deleteByUris: (uris)->
    uris = _.forceArray uris
    adminReq 'post', '/api/entities?action=delete-by-uris', { uris }

  merge: (from, to)->
    from = normalizeUri from
    to = normalizeUri to
    adminReq 'put', '/api/entities?action=merge', { from, to }

  revertMerge: (from)->
    from = normalizeUri from
    adminReq 'put', '/api/entities?action=revert-merge', { from }

  getHistory: (entityId)->
    entityId = entityId.replace 'inv:', ''
    nonAuthReq 'get', "/api/entities?action=history&id=#{entityId}"
    .get 'patches'

  updateLabel: (uri, lang, value)->
    uri = normalizeUri uri
    authReq 'put', '/api/entities?action=update-label', { uri, lang, value }

  updateClaim: (uri, property, oldValue, newValue)->
    uri = normalizeUri uri
    body = { uri, property }
    if oldValue? then body['old-value'] = oldValue
    if newValue? then body['new-value'] = newValue
    authReq 'put', '/api/entities?action=update-claim', body

  addClaim: (uri, property, value)->
    entitiesUtils.updateClaim uri, property, null, value

  getRefreshedPopularityByUris: (uris)->
    if _.isArray(uris) then uris = uris.join('|')
    nonAuthReq 'get', "/api/entities?action=popularity&uris=#{uris}&refresh=true"

  getRefreshedPopularityByUri: (uri)->
    entitiesUtils.getRefreshedPopularityByUris uri
    .then (res)-> res.scores[uri]

normalizeUri = (uri)-> if _.isInvEntityId(uri) then uri = "inv:#{uri}" else uri
