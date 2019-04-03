CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
createInvEntity = require '../create_inv_entity'
properties = require '../properties/properties_values_constraints'
isbn_ = __.require 'lib', 'isbn/isbn'

module.exports = (createOption, userId, batchId)-> (entry)->
  unless createOption then return entry
  { edition, works, authors } = entry

  createAuthors authors, userId, batchId
  .then -> createWorks works, authors, userId, batchId
  .then -> createEdition edition, works, userId, batchId
  .then -> entry

createAuthors = (authors, userId, batchId)->
  unresolvedAuthors = _.reject authors, 'uri'
  Promise.all unresolvedAuthors.map (author)->
    claims = {}

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q5' ]
    createEntityFromSeed author, claims, userId, batchId

createWorks = (works, authors, userId, batchId)->
  unresolvedWorks = _.reject works, 'uri'
  relativesUris = getRelativeUris authors
  Promise.all unresolvedWorks.map (work)->
    claims = {}

    addClaimIfValid claims, 'wdt:P31', [ 'wd:Q571' ]
    addClaimIfValid claims, 'wdt:P50', relativesUris
    createEntityFromSeed work, claims, userId, batchId

createEdition = (edition, works, userId, batchId)->
  relativesUris = getRelativeUris works
  { isbn } = edition
  claims = {}

  addClaimIfValid claims, 'wdt:P31', [ 'wd:Q3331189' ]
  addClaimIfValid claims, 'wdt:P629', relativesUris

  if isbn?
    hyphenatedIsbn = isbn_.toIsbn13h(isbn)
    addClaimIfValid claims, 'wdt:P212', [ hyphenatedIsbn ]

  unless edition.claims['wdt:P1476']?.length is 1
    title = buildBestEditionTitle edition, works
    edition.claims['wdt:P1476'] = [ title ]

  # garantee that an edition shall not have label
  edition.labels = {}
  createEntityFromSeed edition, claims, userId, batchId

getRelativeUris = (relatives)-> _.compact _.map(relatives, 'uri')

createEntityFromSeed = (seed, entityClaims, userId, batchId)->
  { labels, claims: seedClaims } = seed

  for property, values of seedClaims
    addClaimIfValid entityClaims, property, values

  createInvEntity { labels, claims, userId, batchId }
  .then addUriCreated(seed)

addUriCreated = (entryEntity)-> (createdEntity)->
  unless createdEntity._id? then return
  entryEntity.uri = "inv:#{createdEntity._id}"
  entryEntity.created = true

buildBestEditionTitle = (edition, works)->
  # return in priority values of wdt:P1476, which shall have only one element
  if edition.claims['wdt:P1476']
    edition.claims['wdt:P1476'][0]
  else
    # return best guess, hyphenate works labels
    _(works)
    .map (work)-> _.uniq _.values(work.labels)
    .flatten()
    .uniq()
    .join ' - '

addClaimIfValid = (claims, property, values)->
  for value in values
    if value? and properties[property].validate value
      claims[property] ?= []
      claims[property].push value
