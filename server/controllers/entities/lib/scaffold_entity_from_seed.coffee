CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ parse:parseIsbn } = __.require 'lib', 'isbn/isbn'
entities_ = require './entities'
# It is simpler to use a consistent, recognizable mocked user id
# than to put exceptions everywhere
seedUserId = CONFIG.adminUserIds.seed

{ enabled, host } = CONFIG.dataseed

module.exports = (seed)->
  unless _.isNonEmptyString seed.title
    return error_.reject 'insufficient seed data', 400, seed

  isbnData = parseIsbn seed.isbn

  unless isbnData?
    return error_.reject 'invalid isbn', 400, seed

  _.extend seed, isbnData
  lang = seed.groupLang or 'en'

  authorsPromises = createAuthorsEntities seed, lang
  workPromise = createWorkEntity seed, lang, authorsPromises
  return createEditionEntity seed, workPromise

createAuthorsEntities = (seed, lang)->
  promises_.all seed.authors.map(CreateAuthorEntity(lang))

CreateAuthorEntity = (lang)-> (authorName)->
  labels = {}
  labels[lang] = authorName
  claims =
    'wdt:P31': [ 'wd:Q5' ]

  entities_.create()
  .then (doc)-> entities_.edit seedUserId, labels, claims, doc
  .then _.Log('created author entity')
  .catch _.ErrorRethrow('createAuthorEntity err')

createWorkEntity = (seed, lang, authorsPromises)->
  labels = {}
  labels[lang] = seed.title
  claims =
    'wdt:P31': [ 'wd:Q571' ]

  promises_.all [
    entities_.create()
    authorsPromises
  ]
  .spread (doc, authors)->
    authorsIds = authors.map (author)-> "inv:#{author._id}"
    claims['wdt:P50'] = authorsIds
    return entities_.edit seedUserId, labels, claims, doc

  .then _.Log('created work entity')
  .catch _.ErrorRethrow('createWorkEntity err')

createEditionEntity = (seed, workPromise)->
  # The title is let to the work
  labels = {}
  claims =
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P212': [ seed.isbn13h ]
    # wdt:P957 and wdt:P407 will be inferred from 'wdt:P212'

  { image, publicationDate } = seed
  if image? then claims['wdt:P18'] = [ image ]
  if publicationDate? then claims['wdt:P577'] = [ publicationDate ]

  promises_.all [
    entities_.create()
    workPromise
  ]
  .spread (doc, work)->
    claims['wdt:P629'] = [ "inv:#{work._id}" ]
    return entities_.edit seedUserId, labels, claims, doc

  .then _.Log('created edition entity')
  .catch _.ErrorRethrow('createEditionEntity err')
