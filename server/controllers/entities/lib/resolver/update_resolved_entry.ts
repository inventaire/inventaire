import { cloneDeep, isEqual, omit, pick } from 'lodash-es'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getClaimValue, getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { normalizeTitle } from '#controllers/entities/lib/resolver/helpers'
import type { ResolverBatchParams } from '#controllers/entities/lib/resolver/resolve_update_and_create'
import { addWdClaims } from '#controllers/entities/lib/update_wd_claim'
import { updateWdEntityLocalClaims } from '#controllers/entities/lib/update_wd_entity_local_claims'
import { convertAndCleanupImageUrl } from '#controllers/images/lib/convert_and_cleanup_image_url'
import { getUserById } from '#controllers/user/lib/user'
import { objectKeys } from '#lib/utils/types'
import { addEntityDocClaims } from '#models/entity'
import type { AbsoluteUrl } from '#server/types/common'
import type { ClaimByDatatype, Claims, InvEntity, InvEntityDoc, SerializedWdEntity } from '#server/types/entity'
import type { BatchId } from '#server/types/patch'
import type { EntitySeed, ResolverEntry } from '#server/types/resolver'
import type { UserId } from '#server/types/user'
import { getEntityById, putInvEntityUpdate } from '../entities.js'

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

  const entity = await getEntityByUri({ uri, refresh: true })
  if ('wdId' in entity) {
    await updateWdClaims(entity, seedClaims, imageUrl, reqUserId)
  } else {
    const { invId } = entity
    const entityDoc = await getEntityById(invId)
    await updateInvClaims(entityDoc, seedClaims, imageUrl, reqUserId, batchId)
  }
}

async function updateInvClaims (entity: InvEntityDoc, seedClaims: Claims, imageUrl: AbsoluteUrl | undefined, reqUserId: UserId, batchId: BatchId) {
  if (!('claims' in entity)) return
  if (entity.type !== 'entity') return
  // Do not update if property already exists (except if date is more precise)
  // Known cases: avoid updating authors who are actually edition translators
  const updatedEntity: InvEntity = cloneDeep(entity)
  dropLikelyBadSubtitle({ updatedEntity, seedClaims })
  const newClaims: Claims = omit(seedClaims, objectKeys(entity.claims))
  const imageHash = await getImageHash(entity, imageUrl)
  if (imageHash) newClaims['invp:P2'] = [ imageHash ]
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

async function updateWdClaims (entity: SerializedWdEntity, seedClaims: Claims, imageUrl: AbsoluteUrl | undefined, reqUserId: UserId) {
  const user = await getUserById(reqUserId)
  const newClaims: Claims = omit(seedClaims, objectKeys(entity.claims))
  const id = entity.wdId
  await addWdClaims(id, newClaims, user)
  const imageHash = await getImageHash(entity, imageUrl)
  if (imageHash) await updateWdEntityLocalClaims(user, id, 'invp:P2', null, imageHash)
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

async function getImageHash (entity: InvEntity | SerializedWdEntity, imageUrl: AbsoluteUrl | undefined) {
  if (!imageUrl) return
  const existingImageClaim = getFirstClaimValue(entity.claims, 'invp:P2')
  if (existingImageClaim) return
  const { hash: imageHash } = await convertAndCleanupImageUrl({ url: imageUrl, container: 'entities' })
  return imageHash
}

function updateDatePrecision (entity: InvEntity, updatedEntity: InvEntity, seedClaims: Claims) {
  const seedDateClaims = pick(seedClaims, simpleDayProperties) as Pick<Claims, typeof simpleDayProperties[number]>
  for (const property of objectKeys(seedDateClaims)) {
    const seedDate = getFirstClaimValue(seedDateClaims, property)
    if (!seedDate) return
    const currentDate = getFirstClaimValue(entity.claims, property)
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

const doDatesAgree = (seedDate: string, currentDate: string) => seedDate.startsWith(currentDate)

const isMorePreciseDate = (date1: ClaimByDatatype['date'], date2: ClaimByDatatype['date']) => dateParts(date1).length > dateParts(date2).length

function dateParts (simpleDayClaim: ClaimByDatatype['date']) {
  const value = getClaimValue(simpleDayClaim) as string
  return value.split('-')
}
