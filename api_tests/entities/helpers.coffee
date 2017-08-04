CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = __.require 'apiTests', 'utils/utils'
randomString = __.require 'lib', './utils/random_string'

module.exports = helpers =
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

  createHuman: ->
    authReq 'post', '/api/entities?action=create',
      labels: { en: randomString(6) }
      claims: { 'wdt:P31': [ 'wd:Q5' ] }

  createWork: ->
    authReq 'post', '/api/entities?action=create',
      labels: { en: randomString(6) }
      claims: { 'wdt:P31': [ 'wd:Q571' ] }

  createWorkWithAuthor: (human)->
    humanPromise = if human then Promise.resolve(human) else helpers.createHuman()

    humanPromise
    .then (human)->
      authReq 'post', '/api/entities?action=create',
        labels: { en: randomString(6) }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ human.uri ]

  createEdition: ->
    helpers.createWork()
    .then (work)->
      authReq 'post', '/api/entities?action=create',
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': [ work.uri ]
          'wdt:P1476': [ work.labels.en ]
