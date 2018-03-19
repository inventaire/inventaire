CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ nonAuthReq, authReq, adminReq } = require './utils'

module.exports = entitiesUtils =
  getByUris: (uris)->
    if _.isArray(uris) then uris = uris.join('|')
    nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{uris}"

  deleteByUris: (uris)->
    if _.isArray(uris) then uris = uris.join('|')
    adminReq 'delete', "/api/entities?action=by-uris&uris=#{uris}"

  merge: (from, to)-> adminReq 'put', '/api/entities?action=merge', { from, to }

  revertMerge: (from)->
    adminReq 'put', '/api/entities?action=revert-merge', { from }

  getHistory: (entityId)->
    nonAuthReq 'get', "/api/entities?action=history&id=#{entityId}"

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

normalizeUri = (uri)-> if _.isInvEntityId(uri) then uri = "inv:#{uri}" else uri
