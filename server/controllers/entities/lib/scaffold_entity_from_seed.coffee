# A module to put the basis of an edition entity based on the results from dataseed.
# It tries to find the associated works and authors from Wikidata and Inventaire search
# (using searchWorkEntityByTitleAndAuthors) but if it fails to find the corresponding entities,
# it creates new ones. It assumes that any seed arriving here found no match to its ISBN

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ parse:parseIsbn } = __.require 'lib', 'isbn/isbn'
entities_ = require './entities'
createAndEditEntity = require './create_and_edit_entity'
# It is simpler to use a consistent, recognizable mocked user id
# than to put exceptions everywhere
seedUserId = CONFIG.adminUserIds.seed
workEntitiesCache = require './work_entity_search_dedupplicating_cache'

{ enabled, host } = CONFIG.dataseed

# Can't be required directly as it would create a dependency loop with getEntitiesByUris
# so requiring it at first run time
searchWorkEntityByTitleAndAuthors = null

module.exports = (seed)->
  searchWorkEntityByTitleAndAuthors or= require './search_work_entity_by_title_and_authors'

  unless _.isNonEmptyString seed.title
    return error_.reject 'insufficient seed data', 400, seed

  isbnData = parseIsbn seed.isbn

  unless isbnData?
    return error_.reject 'invalid isbn', 400, seed

  _.extend seed, isbnData
  lang = seed.groupLang or 'en'

  searchWorkEntityByTitleAndAuthors seed
  .then (workEntity)->
    if workEntity?
      _.log seed, "scaffolding from existing work entity: #{workEntity.uri}"
      workPromise = promises_.resolve workEntity
    else
      _.log seed, 'scaffolding from scratch'
      authorsPromises = createAuthorsEntities seed, lang
      workPromise = createWorkEntity seed, lang, authorsPromises

    workEntitiesCache.set seed, workPromise
    return createEditionEntity seed, workPromise

createAuthorsEntities = (seed, lang)->
  promises_.all seed.authors.map(CreateAuthorEntity(lang))

CreateAuthorEntity = (lang)-> (authorName)->
  labels = {}
  labels[lang] = authorName
  claims =
    'wdt:P31': [ 'wd:Q5' ]

  createAndEditEntity labels, claims, seedUserId
  .then _.Log('created author entity')
  .catch _.ErrorRethrow('createAuthorEntity err')

createWorkEntity = (seed, lang, authorsPromises)->
  labels = {}
  labels[lang] = seed.title
  claims =
    'wdt:P31': [ 'wd:Q571' ]

  authorsPromises
  .then (authors)->
    authorsIds = authors.map (author)-> "inv:#{author._id}"
    claims['wdt:P50'] = authorsIds
    return createAndEditEntity labels, claims, seedUserId
  .then _.Log('created work entity')
  .catch _.ErrorRethrow('createWorkEntity err')

createEditionEntity = (seed, workPromise)->
  # The title is set hereafter as monolingue title (wdt:P1476)
  # instead of as a label
  labels = {}
  claims =
    'wdt:P1476': [ seed.title ]
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P212': [ seed.isbn13h ]
    # wdt:P957 and wdt:P407 will be inferred from 'wdt:P212'

  { image, publicationDate } = seed
  if image? then claims['wdt:P18'] = [ image ]
  if publicationDate? then claims['wdt:P577'] = [ publicationDate ]

  workPromise
  .then (work)->
    workUri = work.uri or "inv:#{work._id}"
    claims['wdt:P629'] = [ workUri ]
    return createAndEditEntity labels, claims, seedUserId
  .then _.Log('created edition entity')
  .catch _.ErrorRethrow('createEditionEntity err')
