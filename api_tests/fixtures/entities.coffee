CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'
{ Promise } = __.require 'lib', 'promises'
randomString = __.require 'lib', './utils/random_string'
isbn_ = __.require 'lib', 'isbn/isbn'
wdLang = require 'wikidata-lang'
{ getByUris } = require '../utils/entities'

defaultEditionData = ->
  labels: {}
  claims:
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P1476': [ randomString(4) ]

createEntity = (P31)-> (params = {})->
  labels = params.labels or { en: randomString(6) }
  authReq 'post', '/api/entities?action=create',
    labels: labels
    claims: { 'wdt:P31': [ P31 ] }

module.exports = API =
  createHuman: createEntity 'wd:Q5'
  createWork: createEntity 'wd:Q571'
  createSerie: createEntity 'wd:Q277759'

  createWorkWithAuthor: (human)->
    humanPromise = if human then Promise.resolve(human) else API.createHuman()

    humanPromise
    .then (human)->
      authReq 'post', '/api/entities?action=create',
        labels: { en: randomString(6) }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ human.uri ]

  createEdition: (params = {})->
    { work, works, lang } = params
    lang or= 'en'
    if work? and not works? then works = [ work ]
    worksPromise = if works? then Promise.resolve(works) else API.createWork()

    worksPromise
    .then (works)->
      works = _.forceArray works
      worksUris = _.pluck works, 'uri'
      authReq 'post', '/api/entities?action=create',
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': worksUris
          'wdt:P1476': [ _.values(works[0].labels)[0] ]
          'wdt:P407': [ 'wd:' + wdLang.byCode[lang].wd ]

  createEditionFromWorks: (works...)->
    params = { works }
    API.createEdition params

  createEditionWithWorkAuthorAndSerie: ->
    API.createWorkWithAuthor()
    .tap API.addSerie
    .then (work)-> API.createEdition { work }

  createItemFromEntityUri: (uri, data = {})->
    authReq 'post', '/api/items', _.extend({}, data, { entity: uri })

  ensureEditionExists: (uri, workData, editionData)->
    getByUris uri
    .get 'entities'
    .then (entities)->
      if entities[uri]? then return entities[uri]
      workData or= {
        labels: { fr: 'bla' }
        claims: { 'wdt:P31': [ 'wd:Q571' ] }
      }
      authReq 'post', '/api/entities?action=create',
        labels: { de: 'Mr moin moin' }
        claims: { 'wdt:P31': [ 'wd:Q5' ] }
      .then (authorEntity)->
        workData.claims['wdt:P50'] = [ authorEntity.uri ]
        authReq 'post', '/api/entities?action=create', workData
      .then (workEntity)->
        editionData or= defaultEditionData()
        [ prefix, id ] = uri.split ':'
        if isbn_.isValidIsbn id
          editionData.claims['wdt:P212'] = [ isbn_.toIsbn13h(id) ]
        editionData.claims['wdt:P629'] = [ workEntity.uri ]
        authReq 'post', '/api/entities?action=create', editionData

addEntityClaim = (createFn, property)-> (subjectEntity)->
  API[createFn]()
  .tap (entity)-> API.addClaim subjectEntity.uri, property, entity.uri

API.addAuthor = addEntityClaim 'createHuman', 'wdt:P50'
API.addSerie = addEntityClaim 'createSerie', 'wdt:P179'
