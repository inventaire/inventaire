import { chain, compact, map, without } from 'lodash-es'
import { convertAndCleanupImageUrl } from '#controllers/images/lib/convert_and_cleanup_image_url'
import { getImageByIsbn } from '#data/dataseed/dataseed'
import { isNonEmptyString } from '#lib/boolean_validations'
import { toIsbn13h } from '#lib/isbn/isbn'
import { logError, warn } from '#lib/utils/logs'
import { getFirstClaimValue } from '#models/entity'
import type { Claims, EntityType, InvSimplifiedPropertyClaims, PropertyUri } from '#types/entity'
import type { BatchId } from '#types/patch'
import type { EditionSeed, EntitySeed } from '#types/resolver'
import type { UserId } from '#types/user'
import { createInvEntity } from '../create_inv_entity.js'
import { propertiesValuesConstraints as properties } from '../properties/properties_values_constraints.js'

export const createAuthor = (userId: UserId, batchId: BatchId) => (author: EntitySeed) => {
  if (author.uri != null) return author
  addClaimIfValid(author.claims, 'wdt:P31', [ 'wd:Q5' ], 'human')
  return createEntityFromSeed({ seed: author, userId, batchId })
}

export const createWork = (userId: UserId, batchId: BatchId, authors: EntitySeed[]) => (work: EntitySeed) => {
  if (work.uri != null) return work
  const authorsUris = compact(map(authors, 'uri'))
  addClaimIfValid(work.claims, 'wdt:P31', [ 'wd:Q47461344' ], 'work')
  addClaimIfValid(work.claims, 'wdt:P50', authorsUris)
  return createEntityFromSeed({ seed: work, userId, batchId })
}

export async function createEdition (edition: EditionSeed, works: EntitySeed[], userId: UserId, batchId: BatchId, enrich?: boolean) {
  if (edition.uri != null) return

  const { isbn } = edition
  let { image: imageUrl } = edition
  const worksUris = compact(map(works, 'uri'))

  addClaimIfValid(edition.claims, 'wdt:P31', [ 'wd:Q3331189' ], 'edition')
  addClaimIfValid(edition.claims, 'wdt:P629', worksUris)

  if (isbn != null) {
    const hyphenatedIsbn = toIsbn13h(isbn)
    addClaimIfValid(edition.claims, 'wdt:P212', [ hyphenatedIsbn ])
  }

  const titleClaims = edition.claims['wdt:P1476']
  if (titleClaims == null || titleClaims.length !== 1) {
    const title = buildBestEditionTitle(edition, works)
    if (isNonEmptyString(title)) {
      edition.claims['wdt:P1476'] = [ title ]
    }
  }
  if (getFirstClaimValue(edition.claims, 'wdt:P1476') && !getFirstClaimValue(edition.claims, 'wdt:P1680')) {
    extractSubtitleFromTitle(edition.claims)
  }

  // garantee that an edition shall not have label
  edition.labels = {}

  if (!imageUrl && !getFirstClaimValue(edition.claims, 'invp:P2') && enrich === true && isbn != null) {
    try {
      const { url } = await getImageByIsbn(isbn)
      imageUrl = url
    } catch (err) {
      if (err.statusCode !== 404) {
        logError(err, 'failed to find an image by ISBN')
      }
    }
  }

  if (imageUrl) {
    const { hash: imageHash } = await convertAndCleanupImageUrl({ url: imageUrl, container: 'entities' })
    if (imageHash) edition.claims['invp:P2'] = [ imageHash ]
  }

  return createEntityFromSeed({ seed: edition, userId, batchId })
}

// An entity type is required only for properties with validation functions requiring a type
// Ex: typedExternalId properties
function addClaimIfValid (claims: Claims, property: PropertyUri, values: InvSimplifiedPropertyClaims, entityType?: EntityType) {
  for (const value of values) {
    if (value != null && properties[property].validate({ value, entityType })) {
      if (claims[property] == null) claims[property] = []
      claims[property].push(value)
    }
  }
}

async function createEntityFromSeed ({ seed, userId, batchId }: { seed: EntitySeed, userId: UserId, batchId: BatchId }) {
  let entity
  try {
    entity = await createInvEntity({
      labels: seed.labels,
      claims: seed.claims,
      userId,
      batchId,
    })
  } catch (err) {
    if (err.name === 'InvalidClaimValueError' || err.cause?.name === 'InvalidClaimValueError') {
      const { property, value } = err.context
      if (seed.claims[property].includes(value)) {
        warn(err, 'InvalidClaimValueError: removing invalid claim')
        seed.claims[property] = without(seed.claims[property], value)
        return createEntityFromSeed({ seed, userId, batchId })
      } else {
        logError(err, 'invalid claim not found, cant recover seed')
      }
    }
    throw err
  }

  seed.uri = entity.uri
  seed.created = true
  // Do not just merge objects, as the created flag
  // would be overriden by the created timestamp
  seed.labels = entity.labels
  seed.claims = entity.claims
}

function buildBestEditionTitle (edition, works) {
  const editionTitleClaim = getFirstClaimValue(edition.claims, 'wdt:P1476')
  if (editionTitleClaim) return editionTitleClaim
  else return guessEditionTitleFromWorksLabels(works)
}

// TODO: give priority to work label in the edition lang
// if this one is known
function guessEditionTitleFromWorksLabels (works) {
  return chain(works)
  .flatMap(work => Object.values(work.labels))
  .uniq()
  .join(' - ')
  .value()
}

function extractSubtitleFromTitle (claims) {
  let title = getFirstClaimValue(claims, 'wdt:P1476')
  let subtitle
  if (title.length > 10 && title.split(subtitleSeparator).length === 2) {
    [ title, subtitle ] = title.split(subtitleSeparator)
    claims['wdt:P1476'] = [ title.trim() ]
    claims['wdt:P1680'] = [ subtitle.trim() ]
  }
}

const subtitleSeparator = /[-—:] /
