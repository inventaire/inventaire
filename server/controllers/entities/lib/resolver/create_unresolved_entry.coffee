CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
createEntity = require '../create_entity'
properties = require '../properties/properties_values_constraints'
isbn_ = __.require 'lib', 'isbn/isbn'

module.exports = (entry, userId)->
  { edition, works, authors } = entry

  createAuthors authors, userId
  .then -> createWorks(works, authors, userId)
  .then -> createEdition(edition, works, userId)

createAuthors = (authors, userId)->
  claims = { 'wdt:P31': [ 'wd:Q5' ] }
  unresolvedAuthors = _.reject authors, 'uri'

  Promise.all unresolvedAuthors.map (author)->
    { labels } = author
    createEntity labels, claims, userId
    .then _.Log('created work entity')
    .catch _.ErrorRethrow('createAuthorEntity err')
    .then addUriCreated(author)

createWorks = (works, authors, userId)->
  authorsUris = _.compact(authors.map _.property('uri'))
  unresolvedWorks = _.reject works, 'uri'

  Promise.all unresolvedWorks.map (work)->
    { labels } = work
    unless _.isNonEmptyPlainObject(labels) then return
    claims =
      'wdt:P31': [ 'wd:Q571' ]
      'wdt:P50': authorsUris

    createEntity labels, claims, userId
    .then addUriCreated(work)
    .then _.Log('created work entity')
    .catch _.ErrorRethrow('createWorkEntity err')

createEdition = (edition, works, userId)->
  { isbn, claims } = edition
  unless isbn_.isValidIsbn(isbn) then return edition

  editionTitle = buildBestEditionTitle(edition, works)
  worksUris = _.map works, _.property('uri')
  formatedIsbn = isbn_.toIsbn13h(isbn)
  labels = {}
  claims =
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P212': [ formatedIsbn ]
    'wdt:P1476': [ editionTitle ]
    'wdt:P629': worksUris

  createEntity labels, claims, userId
  .then addUriCreated(edition)
  .then _.Log('created edition entity')
  .catch _.ErrorRethrow('createEditionEntity err')

addUriCreated = (entryEntity)-> (createdEntity)->
  unless createdEntity._id? then return
  entryEntity.uri = "inv:#{createdEntity._id}"
  entryEntity.created = true

buildBestEditionTitle = (edition, works)->
  if edition.claims['wdt:P1476'] then return edition.claims['wdt:P1476'][0]
  titles = works.map (work)-> _.uniq(_.values(work.labels))
  _.join(_.uniq(_.flatten(titles)), '-')
