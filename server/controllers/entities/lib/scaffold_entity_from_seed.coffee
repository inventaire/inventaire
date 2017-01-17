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
{ validatePropertyValueSync } = require './entities'
createAndEditEntity = require './create_and_edit_entity'
# It is simpler to use a consistent, recognizable mocked user id
# than to put exceptions everywhere
seedUserId = __.require('couch', 'hard_coded_documents').users.seed._id
workEntitiesCache = require './work_entity_search_dedupplicating_cache'

# Can't be required directly as it would create a dependency loop with getEntitiesByUris
# so requiring it at first run time
searchWorkEntityByTitleAndAuthors = null

# seed attributes:
# MUST have: isbn
# MAY have: title, authors, image, publicationDate, numberOfPages
# Data deduced from isbn: isbn13h, groupLang

# Motivation to accept seeds without title or author:
# Every isbn needs to have its edition entity and an associated author entity,
# thus we create the expected entities what so ever

module.exports = (seed)->
  searchWorkEntityByTitleAndAuthors or= require './search_work_entity_by_title_and_authors'

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
  { title } = seed
  if _.isNonEmptyString(title) then labels[lang] = title
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
  # The title is set hereafter as monolingual title (wdt:P1476)
  # instead of as a label
  labels = {}
  claims =
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P212': [ seed.isbn13h ]
    # wdt:P957 and wdt:P407 will be inferred from 'wdt:P212'

  addClaimIfValid claims, 'wdt:P1476', seed.title
  addClaimIfValid claims, 'wdt:P18', seed.image
  addClaimIfValid claims, 'wdt:P577', seed.publicationDate
  addClaimIfValid claims, 'wdt:P1104', seed.numberOfPages

  workPromise
  .then (work)->
    workUri = work.uri or "inv:#{work._id}"
    claims['wdt:P629'] = [ workUri ]
    return createAndEditEntity labels, claims, seedUserId
  .then _.Log('created edition entity')
  .catch _.ErrorRethrow('createEditionEntity err')

addClaimIfValid = (claims, property, value)->
  if value? and validatePropertyValueSync property, value
    claims[property] = [ value ]

  return
