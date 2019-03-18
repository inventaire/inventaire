CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
createEntity = require '../create_entity'
properties = require '../properties/properties_values_constraints'
isbn_ = __.require 'lib', 'isbn/isbn'

module.exports = (createOption, userId, summary)-> (entry)->
  { edition, works, authors } = entry
  unless createOption then return entry

  createAuthors authors, userId, summary
  .then -> createWorks(works, authors, userId, summary)
  .then -> createEdition(edition, works, userId, summary)
  .then -> entry

createAuthors = (authors, userId, summary)->
  unresolvedAuthors = _.reject authors, 'uri'
  Promise.all unresolvedAuthors.map (author)->
    claims = { }

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q5' ]
    createEntityFromEntry author, claims, userId, summary

createWorks = (works, authors, userId, summary)->
  unresolvedWorks = _.reject works, 'uri'
  relativesUris = getRelativeUris authors
  Promise.all unresolvedWorks.map (work)->
    claims = { }

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q571' ]
    addClaimIfValid claims, 'wdt:P50', relativesUris
    createEntityFromEntry work, claims, userId, summary

createEdition = (edition, works, userId, summary)->
  relativesUris = getRelativeUris works
  Promise.all edition.map (edition)->
    { isbn } = edition
    claims = { }

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q3331189' ]
    addClaimIfValid claims, 'wdt:P629', relativesUris

    if isbn?
      hyphenatedIsbn = isbn_.toIsbn13h(isbn)
      addClaimIfValid claims, 'wdt:P212', [ hyphenatedIsbn ]

    addClaimEditionTitle edition, works, claims

    # garantee that an edition shall not have label
    edition.labels = { }
    createEntityFromEntry edition, claims, userId, summary

getRelativeUris = (relatives)->
  _.compact(_.map(relatives, 'uri'))

createEntityFromEntry = (entity, claims, userId, summary)->
  { labels, claims:entryClaims } = entity

  for property, values of entryClaims
    addClaimIfValid claims, property, values

  createEntity labels, claims, userId, summary
  .then _.Log("created entity")
  .catch _.ErrorRethrow("createEntity err")
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
