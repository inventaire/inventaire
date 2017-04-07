CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = __.require 'apiTests', 'utils/utils'

module.exports =
  ensureEditionExists: (uri, workData, editionData)->
    authReq 'get', "/api/entities?action=by-uris&uris=#{uri}"
    .get 'entities'
    .then (entities)->
      if entities[uri]? then return entities[uri]
      workData or= {
        labels: { fr: 'bla' }
        claims: { 'wdt:P31': [ 'wd:Q571' ] }
      }
      authReq 'post', '/api/entities?action=create',
        labels: { de: 'Mr moin moin'}
        claims: { 'wdt:P31': [ 'wd:Q5' ] }
      .then (authorEntity)->
        workData.claims['wdt:P50'] = [ authorEntity.uri ]
        authReq 'post', '/api/entities?action=create', workData
      .then (workEntity)->
        editionData.claims['wdt:P629'] = [ workEntity.uri ]
        authReq 'post', '/api/entities?action=create', editionData
