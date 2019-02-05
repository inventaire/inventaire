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
    createEntityFromEntry('author', author, null, userId)

createWorks = (works, authors, userId)->
  unresolvedWorks = _.reject works, 'uri'

  Promise.all unresolvedWorks.map (work)->
    createEntityFromEntry('work', work, authors, userId)

createEdition = (edition, works, userId)->
  Promise.all edition.map (edition)->
    createEntityFromEntry('edition', edition, works, userId)

createEntityFromEntry = (name, entity, relatives, userId)->
  { labels, claims:entryClaims } = entity
  if entity.uri? then return

  claims = {}
  for property, values of entryClaims
    addClaimIfValid(claims, property, values)

  relativeUris = _.compact(_.map(relatives, 'uri'))
  if name is 'author'
    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q5' ]
  else if name is 'work'
    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q571' ]
    addClaimIfValid claims, 'wdt:P50', relativeUris
  else if name is 'edition'
    { isbn } = entity
    labels = {}
    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q3331189' ]
    addClaimIfValid claims, 'wdt:P629', relativeUris

    if isbn?
      hyphenatedIsbn = isbn_.toIsbn13h(isbn)
      addClaimIfValid(claims, 'wdt:P212', [ hyphenatedIsbn ])

    addClaimEditionTitle(entity, relatives, claims)

  createEntity labels, claims, userId
  .then _.Log("created #{ name } entity")
  .catch _.ErrorRethrow("create#{ name }Entity err")
  .then addUriCreated(entity)

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
  # return best guess, hyphenate works labels
  titles = works.map (work)-> _.uniq(_.values(work.labels))
  _.join(_.uniq(_.flatten(titles)), '-')

addClaimIfValid = (claims, property, values)->
  for value in values
    if value? and properties[property].validate value
      if claims[property]?
        claims[property].push value
      else
        claims[property] = [ value ]
