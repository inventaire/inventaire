CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
createInvEntity = require '../create_inv_entity'
properties = require '../properties/properties_values_constraints'
isbn_ = __.require 'lib', 'isbn/isbn'

module.exports = (userId, batchId)-> (entry)->
  { edition, works, authors } = entry

  createAuthors entry, userId, batchId
  .then -> createWorks entry, userId, batchId
  .then -> createEdition entry, userId, batchId
  .then -> entry

createAuthors = (entry, userId, batchId)->
  { authors } = entry
  Promise.all authors.map(createAuthor(userId, batchId))

createAuthor = (userId, batchId)-> (author)->
  if author.uri? then return author
  claims = {}

  addClaimIfValid claims, 'wdt:P31', [ 'wd:Q5' ]
  createSeed author, claims, userId, batchId

createSeed = (seed, claims, userId, batchId)->
  createInvEntity {
    labels: seed.labels,
    claims: buildClaims(seed.claims, claims),
    userId,
    batchId
  }
  .then addCreatedUriToSeed(seed)

createWorks = (entry, userId, batchId)->
  { works, authors } = entry
  Promise.all works.map(createWork(userId, batchId, authors))

createWork = (userId, batchId, relatives)-> (work)->
  relativesUris = getUris relatives

  if work.uri? then return work
  claims = {}

  addClaimIfValid claims, 'wdt:P31', [ 'wd:Q571' ]
  addClaimIfValid claims, 'wdt:P50', relativesUris
  createSeed work, claims, userId, batchId

createEdition = (entry, userId, batchId)->
  { edition, works } = entry

  if edition.uri? then return Promise.resolve()
  relativesUris = getUris works
  { isbn } = edition
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

getUris = (relatives)-> _.compact _.map(relatives, 'uri')

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

addClaimIfValid = (claims, property, values)->
  for value in values
    if value? and properties[property].validate value
      claims[property] ?= []
      claims[property].push value
