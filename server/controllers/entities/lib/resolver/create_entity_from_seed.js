
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const properties = require('../properties/properties_values_constraints')
const createInvEntity = require('../create_inv_entity')
const isbn_ = __.require('lib', 'isbn/isbn')

const createAuthor = (userId, batchId) => author => {
  if (author.uri != null) return author
  const claims = {}

  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q5' ])
  return createEntityFromSeed({ type: 'human', seed: author, claims, userId, batchId })
}

const createWork = (userId, batchId, authors) => work => {
  if (work.uri != null) return work
  const authorsUris = _.compact(_.map(authors, 'uri'))
  const claims = {}
  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q571' ])
  addClaimIfValid(claims, 'wdt:P50', authorsUris)
  return createEntityFromSeed({ type: 'work', seed: work, claims, userId, batchId })
}

const createEdition = (edition, works, userId, batchId) => {
  if (edition.uri != null) return Promise.resolve()
  const { isbn } = edition
  const worksUris = _.compact(_.map(works, 'uri'))
  const claims = {}

  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q3331189' ])
  addClaimIfValid(claims, 'wdt:P629', worksUris)

  if (isbn != null) {
    const hyphenatedIsbn = isbn_.toIsbn13h(isbn)
    addClaimIfValid(claims, 'wdt:P212', [ hyphenatedIsbn ])
  }

  if ((edition.claims['wdt:P1476'] != null ? edition.claims['wdt:P1476'].length : undefined) !== 1) {
    const title = buildBestEditionTitle(edition, works)
    edition.claims['wdt:P1476'] = [ title ]
  }

  // garantee that an edition shall not have label
  edition.labels = {}

  return createEntityFromSeed({ type: 'edition', seed: edition, claims, userId, batchId })
}

// An entity type is required only for properties with validation functions requiring a type
// Ex: typedExternalId properties
const addClaimIfValid = (claims, property, values, type) => (() => {
  const result = []
  for (const value of values) {
    if ((value != null) && properties[property].validate(value, type)) {
      if (claims[property] == null) { claims[property] = [] }
      result.push(claims[property].push(value))
    } else {
      result.push(undefined)
    }
  }
  return result
})()

const createEntityFromSeed = params => {
  const { type, seed, claims, userId, batchId } = params
  return createInvEntity({
    labels: seed.labels,
    claims: buildClaims(seed.claims, claims, type),
    userId,
    batchId
  })
  .then(addCreatedUriToSeed(seed))
}

const buildClaims = (seedClaims, entityClaims, type) => {
  for (const property in seedClaims) {
    const values = seedClaims[property]
    addClaimIfValid(entityClaims, property, values, type)
  }
  return entityClaims
}

const addCreatedUriToSeed = entryEntity => createdEntity => {
  if (createdEntity._id == null) return
  entryEntity.uri = `inv:${createdEntity._id}`
  entryEntity.created = true
}

const buildBestEditionTitle = (edition, works) => {
  // return in priority values of wdt:P1476, which shall have only one element
  if (edition.claims['wdt:P1476']) {
    return edition.claims['wdt:P1476'][0]
  } else {
    // return best guess, hyphenate works labels
    return _(works)
    .map(work => _.uniq(_.values(work.labels)))
    .flatten()
    .uniq()
    .join(' - ')
  }
}

module.exports = { createAuthor, createWork, createEdition }
