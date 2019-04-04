CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
properties = require '../properties/properties_values_constraints'
createInvEntity = require '../create_inv_entity'
isbn_ = __.require 'lib', 'isbn/isbn'

createAuthor = (userId, batchId)-> (author)->
  if author.uri? then return author
  claims = {}

  addClaimIfValid claims, 'wdt:P31', [ 'wd:Q5' ]
  createSeed author, claims, userId, batchId

createWork = (userId, batchId, relatives)-> (work)->
  if work.uri? then return work
  relativesUris = _.compact _.map(relatives, 'uri')
  claims = {}
  addClaimIfValid claims, 'wdt:P31', [ 'wd:Q571' ]
  addClaimIfValid claims, 'wdt:P50', relativesUris
  createSeed work, claims, userId, batchId

createEdition = (edition, works, userId, batchId)->
  if edition.uri? then return Promise.resolve()
  { isbn } = edition
  relativesUris = _.compact _.map(works, 'uri')
  claims = {}

  addClaimIfValid claims, 'wdt:P31', [ 'wd:Q3331189' ]
  addClaimIfValid claims, 'wdt:P629', relativesUris

  if isbn?
    hyphenatedIsbn = isbn_.toIsbn13h isbn
    addClaimIfValid claims, 'wdt:P212', [ hyphenatedIsbn ]

  unless edition.claims['wdt:P1476']?.length is 1
    title = buildBestEditionTitle edition, works
    edition.claims['wdt:P1476'] = [ title ]

  # garantee that an edition shall not have label
  edition.labels = {}

  createSeed edition, claims, userId, batchId

addClaimIfValid = (claims, property, values)->
  for value in values
    if value? and properties[property].validate value
      claims[property] ?= []
      claims[property].push value

createSeed = (seed, claims, userId, batchId)->
  createInvEntity {
    labels: seed.labels,
    claims: buildClaims(seed.claims, claims),
    userId,
    batchId
  }
  .then addCreatedUriToSeed(seed)

buildClaims = (seedClaims, entityClaims)->
  for property, values of seedClaims
    addClaimIfValid entityClaims, property, values
  return entityClaims

addCreatedUriToSeed = (entryEntity)-> (createdEntity)->
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

module.exports = { createAuthor, createWork, createEdition }
