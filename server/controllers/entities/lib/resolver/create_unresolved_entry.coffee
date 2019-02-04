CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
createEntity = require '../create_entity'
properties = require '../properties/properties_values_constraints'
isbn_ = __.require 'lib', 'isbn/isbn'

module.exports = (options, userId)-> (entry)->
  { edition, works, authors } = entry
  unless _.includes(options, 'create') then return entry

  createAuthors authors, userId
  .then -> createWorks(works, authors, userId)
  .then -> createEdition(edition, works, userId)
  .then -> entry

createAuthors = (authors, userId)->
  unresolvedAuthors = _.reject authors, 'uri'

  Promise.all unresolvedAuthors.map (author)->
    { labels, claims:entryClaims } = author
    unless _.isNonEmptyPlainObject(labels) then return
    claims = {}

    for property, values of entryClaims
      addClaimIfValid(claims, property, values)

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q5' ]

    createEntity labels, claims, userId
    .then _.Log('created author entity')
    .catch _.ErrorRethrow('createAuthorEntity err')
    .then addUriCreated(author)

createWorks = (works, authors, userId)->
  authorsUris = _.compact(authors.map _.property('uri'))
  unresolvedWorks = _.reject works, 'uri'

  Promise.all unresolvedWorks.map (work)->
    { labels, claims:entryClaims } = work
    unless _.isNonEmptyPlainObject(labels) then return
    claims = {}

    for property, values of entryClaims
      addClaimIfValid(claims, property, values)

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q571' ]
    addClaimIfValid claims, 'wdt:P50', authorsUris

    createEntity labels, claims, userId
    .then addUriCreated(work)
    .then _.Log('created work entity')
    .catch _.ErrorRethrow('createWorkEntity err')

createEdition = (edition, works, userId)->
  Promise.all edition.map (edition)->
    { claims:entryClaims, isbn } = edition
    if edition.uri? then return

    worksUris = _.map works, _.property('uri')
    claims = {}

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q3331189' ]
    addClaimIfValid claims, 'wdt:P629', worksUris

    for property, values of entryClaims
      addClaimIfValid(claims, property, values)

    if isbn?
      hyphenatedIsbn = isbn_.toIsbn13h(isbn)
      addClaimIfValid(claims, 'wdt:P212', [ hyphenatedIsbn ])

    addClaimEditionTitle(edition, works, claims)

    createEntity {}, claims, userId
    .then addUriCreated(edition)
    .then _.Log('created edition entity')
    .catch _.ErrorRethrow('createEditionEntity err')

addUriCreated = (entryEntity)-> (createdEntity)->
  unless createdEntity._id? then return
  entryEntity.uri = "inv:#{createdEntity._id}"
  entryEntity.created = true

addClaimEditionTitle = (edition, works, claims)->
  editionTitle = buildBestEditionTitle(edition, works)
  unless claims['wdt:P1476']?
    addClaimIfValid claims, 'wdt:P1476', [ editionTitle ]

buildBestEditionTitle = (edition, works)->
  # return in priority values of wdt:P1476, which shall have only one element
  if edition.claims['wdt:P1476'] then return edition.claims['wdt:P1476'][0]
  # return best guess, joining hyphenated titles found
  titles = works.map (work)-> _.uniq(_.values(work.labels))
  _.join(_.uniq(_.flatten(titles)), '-')

addClaimIfValid = (claims, property, values)->
  for value in values
    if value? and properties[property].validate value
      if claims[property]?
        claims[property].push value
      else
        claims[property] = [ value ]
