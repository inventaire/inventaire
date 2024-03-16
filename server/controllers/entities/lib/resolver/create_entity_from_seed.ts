import { chain, compact, map } from 'lodash-es'
import { convertAndCleanupImageUrl } from '#controllers/images/lib/convert_and_cleanup_image_url'
import { getImageByIsbn } from '#data/dataseed/dataseed'
import { toIsbn13h } from '#lib/isbn/isbn'
import { logError } from '#lib/utils/logs'
import type { Claims, EntityType, InvPropertyClaims, PropertyUri } from '#types/entity'
import type { BatchId } from '#types/patch'
import type { EditionSeed, EntitySeed } from '#types/resolver'
import type { UserId } from '#types/user'
import createInvEntity from '../create_inv_entity.js'
import { propertiesValuesConstraints as properties } from '../properties/properties_values_constraints.js'
import type { Entries } from 'type-fest'

export const createAuthor = (userId: UserId, batchId: BatchId) => (author: EntitySeed) => {
  if (author.uri != null) return author
  const claims = {}

  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q5' ], 'human')
  return createEntityFromSeed({ type: 'human', seed: author, claims, userId, batchId })
}

export const createWork = (userId: UserId, batchId: BatchId, authors: EntitySeed[]) => (work: EntitySeed) => {
  if (work.uri != null) return work
  const authorsUris = compact(map(authors, 'uri'))
  const claims = {}
  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q47461344' ], 'work')
  addClaimIfValid(claims, 'wdt:P50', authorsUris)
  return createEntityFromSeed({ type: 'work', seed: work, claims, userId, batchId })
}

export async function createEdition (edition: EditionSeed, works: EntitySeed[], userId: UserId, batchId: BatchId, enrich?: boolean) {
  if (edition.uri != null) return

  const { isbn } = edition
  let { image: imageUrl } = edition
  const worksUris = compact(map(works, 'uri'))
  const claims = {}

  addClaimIfValid(claims, 'wdt:P31', [ 'wd:Q3331189' ], 'edition')
  addClaimIfValid(claims, 'wdt:P629', worksUris)

  if (isbn != null) {
    const hyphenatedIsbn = toIsbn13h(isbn)
    addClaimIfValid(claims, 'wdt:P212', [ hyphenatedIsbn ])
  }

  const titleClaims = edition.claims['wdt:P1476']
  if (titleClaims == null || titleClaims.length !== 1) {
    const title = buildBestEditionTitle(edition, works)
    edition.claims['wdt:P1476'] = [ title ]
  }
  if (edition.claims['wdt:P1476']?.[0] && !edition.claims['wdt:P1680']) {
    extractSubtitleFromTitle(edition.claims)
  }

  // garantee that an edition shall not have label
  edition.labels = {}

  if (!imageUrl && !edition.claims['invp:P2']?.[0] && enrich === true && isbn != null) {
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
    if (imageHash) claims['invp:P2'] = [ imageHash ]
  }

  return createEntityFromSeed({ type: 'edition', seed: edition, claims, userId, batchId })
}

// An entity type is required only for properties with validation functions requiring a type
// Ex: typedExternalId properties
function addClaimIfValid (claims: Claims, property: PropertyUri, values: InvPropertyClaims, entityType?: EntityType) {
  for (const value of values) {
    if (value != null && properties[property].validate({ value, entityType })) {
      if (claims[property] == null) claims[property] = []
      claims[property].push(value)
    }
  }
}

async function createEntityFromSeed ({ type, seed, claims, userId, batchId }: { type: EntityType, seed: EntitySeed, claims: Claims, userId: UserId, batchId: BatchId }) {
  const entity = await createInvEntity({
    labels: seed.labels,
    claims: addSeedClaims(claims, seed.claims, type),
    userId,
    batchId,
  })

  seed.uri = entity.uri
  seed.created = true
  // Do not just merge objects, as the created flag
  // would be overriden by the created timestamp
  seed.labels = entity.labels
  seed.claims = entity.claims
}

function addSeedClaims (claims: Claims, seedClaims: Claims, type: EntityType) {
  for (const [ property, values ] of (Object.entries(seedClaims) as Entries<Claims>)) {
    addClaimIfValid(claims, property, values, type)
  }
  return claims
}

function buildBestEditionTitle (edition, works) {
  const editionTitleClaims = edition.claims['wdt:P1476']
  if (editionTitleClaims) return editionTitleClaims[0]
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
  let title = claims['wdt:P1476'][0]
  let subtitle
  if (title.length > 10 && title.split(subtitleSeparator).length === 2) {
    [ title, subtitle ] = title.split(subtitleSeparator)
    claims['wdt:P1476'] = [ title.trim() ]
    claims['wdt:P1680'] = [ subtitle.trim() ]
  }
}

const subtitleSeparator = /[-—:] /
