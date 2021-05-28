const _ = require('builders/utils')
const properties = require('../properties/properties_values_constraints')
const createInvEntity = require('../create_inv_entity')
const isbn_ = require('lib/isbn/isbn')
const { getImageByIsbn } = require('data/dataseed/dataseed')
const convertAndCleanupImageUrl = require('controllers/images/lib/convert_and_cleanup_image_url')

const createAuthor = (userId, batchId) => author => {
  if (author.uri != null) return author
  const claims = {}

  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q5' ], 'human')
  return createEntityFromSeed({ type: 'human', seed: author, claims, userId, batchId })
}

const createWork = (userId, batchId, authors) => work => {
  if (work.uri != null) return work
  const authorsUris = _.compact(_.map(authors, 'uri'))
  const claims = {}
  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q47461344' ], 'work')
  addClaimIfValid(claims, 'wdt:P50', authorsUris)
  return createEntityFromSeed({ type: 'work', seed: work, claims, userId, batchId })
}

const createEdition = async (edition, works, userId, batchId, enrich) => {
  if (edition.uri != null) return

  const { isbn } = edition
  let { image: imageUrl } = edition
  const worksUris = _.compact(_.map(works, 'uri'))
  const claims = {}

  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q3331189' ], 'edition')
  addClaimIfValid(claims, 'wdt:P629', worksUris)

  if (isbn != null) {
    const hyphenatedIsbn = isbn_.toIsbn13h(isbn)
    addClaimIfValid(claims, 'wdt:P212', [ hyphenatedIsbn ])
  }

  const titleClaims = edition.claims['wdt:P1476']
  if (titleClaims == null || titleClaims.length !== 1) {
    const title = buildBestEditionTitle(edition, works)
    edition.claims['wdt:P1476'] = [ title ]
  }

  // garantee that an edition shall not have label
  edition.labels = {}

  if (!imageUrl && enrich === true && isbn != null) {
    try {
      const { url } = await getImageByIsbn(isbn)
      imageUrl = url
    } catch (err) {
      if (err.statusCode !== 404) {
        _.error(err, 'failed to find an image by ISBN')
      }
    }
  }

  if (imageUrl) {
    const { hash: imageHash } = await convertAndCleanupImageUrl({ url: imageUrl, container: 'entities' })
    if (imageHash) claims['invp:P2'] = [ imageHash ]
  }

  return createEntityFromSeed({ type: 'edition', seed: edition, claims, userId, batchId })
}

// An entity type is required only for properties with validation functions requiring a type
// Ex: typedExternalId properties
const addClaimIfValid = (claims, property, values, type) => {
  for (const value of values) {
    if (value != null && properties[property].validate(value, type)) {
      if (claims[property] == null) claims[property] = []
      claims[property].push(value)
    }
  }
}

const createEntityFromSeed = async ({ type, seed, claims, userId, batchId }) => {
  const entity = await createInvEntity({
    labels: seed.labels,
    claims: addSeedClaims(claims, seed.claims, type),
    userId,
    batchId
  })

  seed.uri = entity.uri
  seed.created = true
  // Do not just merge objects, as the created flag
  // would be overriden by the created timestamp
  seed.labels = entity.labels
  seed.claims = entity.claims
}

const addSeedClaims = (claims, seedClaims, type) => {
  for (const property in seedClaims) {
    const values = seedClaims[property]
    addClaimIfValid(claims, property, values, type)
  }
  return claims
}

const buildBestEditionTitle = (edition, works) => {
  const editionTitleClaims = edition.claims['wdt:P1476']
  if (editionTitleClaims) return editionTitleClaims[0]
  else return guessEditionTitleFromWorksLabels(works)
}

// TODO: give priority to work label in the edition lang
// if this one is known
const guessEditionTitleFromWorksLabels = works => {
  return _(works)
  .map(work => Object.values(work.labels))
  .flatten()
  .uniq()
  .join(' - ')
}

module.exports = { createAuthor, createWork, createEdition }
