import { cloneDeep, isEqual, omit, pick } from 'lodash-es'
import { getClaimValue, getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { normalizeTitle } from '#controllers/entities/lib/resolver/helpers'
import type { ResolverBatchParams } from '#controllers/entities/lib/resolver/resolve_update_and_create'
import { convertAndCleanupImageUrl } from '#controllers/images/lib/convert_and_cleanup_image_url'
import { objectKeys } from '#lib/utils/types'
import { addEntityDocClaims } from '#models/entity'
import type { Url } from '#server/types/common'
import type { ClaimByDatatype, Claims, EntityId, EntityUriPrefix, InvEntity, InvEntityDoc, InvEntityId, Isbn } from '#server/types/entity'
import type { BatchId } from '#server/types/patch'
import type { EntitySeed, ResolverEntry } from '#server/types/resolver'
import type { UserId } from '#server/types/user'
import { getInvEntityByIsbn, getEntityById, putInvEntityUpdate } from '../entities.js'

export async function updateResolvedEntry (entry: ResolverEntry, { reqUserId, batchId }: ResolverBatchParams) {
  const { edition, works, authors } = entry

  const allResolvedSeeds = [ edition, ...works, ...authors ].filter(hasUri)

  await Promise.all(allResolvedSeeds.map(updateEntityFromSeed(reqUserId, batchId)))
  return entry
}

const hasUri = seed => seed.uri != null

const updateEntityFromSeed = (reqUserId: UserId, batchId: BatchId) => async (seed: EntitySeed) => {
  const { uri, claims: seedClaims } = seed
  const imageUrl = 'image' in seed ? seed.image : undefined
  if (!uri) return

  const [ prefix, entityId ] = uri.split(':') as [ EntityUriPrefix, EntityId ]
  // Do not try to update Wikidata for the moment
  if (prefix === 'wd') return

  const entity = await getEntity(prefix, entityId)
  await updateClaims(entity, seedClaims, imageUrl, reqUserId, batchId)
}

function getEntity (prefix: EntityUriPrefix, entityId: InvEntityId | Isbn) {
  if (prefix === 'isbn') {
    return getInvEntityByIsbn(entityId)
  } else {
    return getEntityById(entityId)
  }
}

async function updateClaims (entity: InvEntityDoc, seedClaims: Claims, imageUrl: Url | undefined, reqUserId: UserId, batchId: BatchId) {
  if (!('claims' in entity)) return
  if (entity.type !== 'entity') return
  // Do not update if property already exists (except if date is more precise)
  // Known cases: avoid updating authors who are actually edition translators
  const updatedEntity: InvEntity = cloneDeep(entity)
  dropLikelyBadSubtitle({ updatedEntity, seedClaims })
  const newClaims: Claims = omit(seedClaims, Object.keys(entity.claims))
  await addImageClaim(entity, imageUrl, newClaims)
  addEntityDocClaims(updatedEntity, newClaims)
  updateDatePrecision(entity, updatedEntity, seedClaims)
  if (isEqual(updatedEntity, entity)) return
  await putInvEntityUpdate({
    userId: reqUserId,
    currentDoc: entity,
    updatedDoc: updatedEntity,
    batchId,
  })
}

function dropLikelyBadSubtitle ({ updatedEntity, seedClaims }: { updatedEntity: InvEntity, seedClaims: Claims }) {
  const oldTitle = getFirstClaimValue(updatedEntity.claims, 'wdt:P1476')
  const newTitle = getFirstClaimValue(seedClaims, 'wdt:P1476')
  const newSubtitle = getFirstClaimValue(seedClaims, 'wdt:P1680')
  if (oldTitle && newSubtitle) {
    if (normalizeTitle(newTitle) === normalizeTitle(oldTitle)) {
      if (normalizeTitle(newSubtitle).includes(normalizeTitle(oldTitle))) {
        // Avoid adding a subtitle already present in the title
        delete seedClaims['wdt:P1680']
      }
    } else {
      // Only attempt to edit the subtitle if the old and the new title match
      delete seedClaims['wdt:P1680']
    }
  }
}

async function addImageClaim (entity: InvEntity, imageUrl: Url | undefined, newClaims: Claims) {
  if (!imageUrl) return
  const imageClaims = entity.claims['invp:P2']
  if (imageClaims) return
  const { hash: imageHash } = await convertAndCleanupImageUrl({ url: imageUrl, container: 'entities' })
  if (imageHash) newClaims['invp:P2'] = [ imageHash ]
}

function updateDatePrecision (entity: InvEntity, updatedEntity: InvEntity, seedClaims: Claims) {
  const seedDateClaims = pick(seedClaims, simpleDayProperties) as Pick<Claims, typeof simpleDayProperties[number]>
  for (const property of objectKeys(seedDateClaims)) {
    const seedDate = seedDateClaims[property][0]
    if (!seedDate) return
    const currentDate = entity.claims[property]?.[0]
    if (currentDate) {
      if (isMorePreciseDate(seedDate, currentDate) && doDatesAgree(seedDate, currentDate)) {
        updatedEntity.claims[property] = seedDateClaims[property]
      }
    } else {
      updatedEntity.claims[property] = seedDateClaims[property]
    }
  }
}

const simpleDayProperties = [ 'wdt:P569', 'wdt:P570', 'wdt:P571', 'wdt:P576', 'wdt:P577' ] as const

const doDatesAgree = (seedDate, currentDate) => seedDate.startsWith(currentDate)

const isMorePreciseDate = (date1: ClaimByDatatype['date'], date2: ClaimByDatatype['date']) => dateParts(date1).length > dateParts(date2).length

function dateParts (simpleDayClaim: ClaimByDatatype['date']) {
  const value = getClaimValue(simpleDayClaim) as string
  return value.split('-')
}
