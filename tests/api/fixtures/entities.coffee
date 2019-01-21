CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'
{ Promise } = __.require 'lib', 'promises'
isbn_ = __.require 'lib', 'isbn/isbn'
wdLang = require 'wikidata-lang'
{ getByUri, getByUris, addClaim } = require '../utils/entities'
faker = require 'faker'
someImageHash = '00015893d54f5112b99b41b0dfd851f381798047'
someIsbns = [ '9780007419135', '9780521029773', '9781852852016',
  '9780140148237', '9780416812503', '9783525353912', '9780226820132',
  '9780791458693', '9780415303095', '9780099527091', '9780521554596',
  '9780299129309', '9780415377072', '9780752436517', '9780520210813',
  '9782262022822', '9780140148244' ]

defaultEditionData = ->
  labels: {}
  claims:
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P1476': [ API.randomWorkLabel() ]

createEntity = (P31)-> (params = {})->
  defaultLabel = if P31 is 'wd:Q5' then humanName() else API.randomWorkLabel(4)
  labels = params.labels or { en: defaultLabel }
  authReq 'post', '/api/entities?action=create',
    labels: labels
    claims: { 'wdt:P31': [ P31 ] }

humanName = -> faker.fake '{{name.firstName}} {{name.lastName}}'
randomWords = (length)-> faker.random.words(length)

module.exports = API =
  createHuman: createEntity 'wd:Q5'
  createWork: createEntity 'wd:Q571'
  createSerie: createEntity 'wd:Q277759'
  getSomeIsbn: -> _.sample someIsbns
  editionLabel: -> randomWords()
  randomWorkLabel: -> randomWords(5)
  humanName: humanName
  createWorkWithAuthor: (human, label)->
    humanPromise = if human then Promise.resolve(human) else API.createHuman()
    label or= API.randomWorkLabel()

    humanPromise
    .then (human)->
      authReq 'post', '/api/entities?action=create',
        labels: { en: label }
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
      worksUris = _.map works, 'uri'
      authReq 'post', '/api/entities?action=create',
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': worksUris
          'wdt:P1476': [ _.values(works[0].labels)[0] ]
          'wdt:P407': [ 'wd:' + wdLang.byCode[lang].wd ]
          'invp:P2': [ someImageHash ]

  createEditionFromWorks: (works...)->
    params = { works }
    API.createEdition params

  createWorkWithAuthorAndSerie: ->
    API.createWorkWithAuthor()
    .tap API.addSerie
    # Get a refreshed version of the work
    .then (work)-> getByUri work.uri

  createEditionWithWorkAuthorAndSerie: ->
    API.createWorkWithAuthorAndSerie()
    .then (work)-> API.createEdition { work }

  createItemFromEntityUri: (uri, data = {})->
    authReq 'post', '/api/items', _.extend({}, data, { entity: uri })

  ensureEditionExists: (uri, workData, editionData)->
    getByUris uri
    .get 'entities'
    .then (entities)->
      if entities[uri]? then return entities[uri]
      workData or= {
        labels: { fr: API.randomWorkLabel() }
        claims: { 'wdt:P31': [ 'wd:Q571' ] }
      }
      authReq 'post', '/api/entities?action=create',
        labels: { de: humanName() }
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

  someImageHash: someImageHash

  someOpenLibraryId: (type = 'author')->
    types =
      author: 'A',
      work: 'W'
    numbers = Math.random().toString().slice(2, 7)
    return "OL1#{numbers}#{types[type]}"

addEntityClaim = (createFnName, property)-> (subjectEntity)->
  API[createFnName]()
  .tap (valueEntity)-> addClaim subjectEntity.uri, property, valueEntity.uri

API.addAuthor = addEntityClaim 'createHuman', 'wdt:P50'
API.addSerie = addEntityClaim 'createSerie', 'wdt:P179'
