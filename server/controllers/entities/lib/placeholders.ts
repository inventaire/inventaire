// Placeholders are entities automatically created without checking that a similar
// entity existed locally or in Wikidata. Those entities have thus high chances
// to be duplicates and to be deleted by merge operations.

// But mistakes happen, and some merges will need to be reverted:
// thus the remove/recover mechanism hereafter

import { getInvClaimsByClaimValue, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getPatchesByEntityId, sortAntiChronologically } from '#controllers/entities/lib/patches/patches'
import { prefixifyInv, unprefixify } from '#controllers/entities/lib/prefix'
import { updateInvClaim } from '#controllers/entities/lib/update_inv_claim'
import { dbFactory } from '#db/couchdb/base'
import type { UserWithAcct } from '#lib/federation/remote_user'
import { emit } from '#lib/radio'
import { warn } from '#lib/utils/logs'
import { convertEntityDocToPlaceholder, recoverEntityDocFromPlaceholder } from '#models/entity'
import type { EntityUri, InvEntity, InvEntityDoc, InvEntityId, InvEntityUri, RemovedPlaceholderEntity, SerializedEntity, SerializedRemovedPlaceholder } from '#types/entity'
import type { Patch, RemovedPlaceholderPatch } from '#types/patch'

const db = await dbFactory('entities')

export async function removePlaceholder (user: UserWithAcct, uri: InvEntityUri, options: { noRelatedClaimUpdate?: boolean } = {}) {
  const { acct: userAcct } = user
  const { noRelatedClaimUpdate = false } = options
  const entityId = unprefixify(uri)
  warn(entityId, 'removing placeholder entity')
  const currentDoc = await db.get<InvEntityDoc>(entityId)
  if (currentDoc.type === 'removed:placeholder') {
    warn(entityId, 'this entity is already a removed:placeholder: ignored')
    return
  }
  if ('redirect' in currentDoc) {
    warn(entityId, 'this entity is a redirection: ignored')
    return
  }
  try {
    const deletedClaims = noRelatedClaimUpdate ? [] : await deleteClaimsWithUriAsValue(user, uri)
    const updatedDoc = convertEntityDocToPlaceholder(currentDoc)
    await putInvEntityUpdate<RemovedPlaceholderEntity>({ userAcct, currentDoc, updatedDoc, context: { deletedClaims } })
    await emit('entity:remove', `inv:${entityId}`)
    return currentDoc._id
  } catch (err) {
    if (err.message === "can't turn a redirection into a removed placeholder") {
      // Ignore this error as the effects of those two states are close
      // (so much so that it might be worth just having redirections)
      warn(currentDoc, err.message)
    } else {
      throw err
    }
  }
}

async function deleteClaimsWithUriAsValue (user: UserWithAcct, uri: InvEntityUri) {
  const claimsData = await getInvClaimsByClaimValue(uri)
  warn(claimsData, `removing claims with value: ${uri}`)
  await Promise.all(claimsData.map(claimData => {
    const { entity: id, property } = claimData
    return updateInvClaim(user, id, property, uri, null)
  }))
  return claimsData.map(({ entity, property }) => ({ subject: entity as InvEntityId, property }))
}

export async function recoverPlaceholder (user: UserWithAcct, uri: InvEntityUri) {
  const { acct: userAcct } = user
  const entityId = unprefixify(uri)
  warn(entityId, 'recovering placeholder entity')
  const currentDoc = await db.get<InvEntityDoc>(entityId)
  if (currentDoc.type !== 'removed:placeholder') {
    warn(entityId, 'this entity is not a removed:placeholder: ignored')
    return
  }
  const deletionPatch = await findDeletionPatch(entityId)
  const updatedDoc = recoverEntityDocFromPlaceholder(currentDoc)
  await putInvEntityUpdate<InvEntity>({ userAcct, currentDoc, updatedDoc })
  await recoverDeletedClaims(user, uri, deletionPatch)
  await emit('entity:recover', `inv:${entityId}`)
  return currentDoc._id
}

async function recoverDeletedClaims (user: UserWithAcct, claimValueUri: EntityUri, patch?: RemovedPlaceholderPatch) {
  if (!patch) return
  const { deletedClaims } = patch.context
  for (const { subject, property } of deletedClaims) {
    const subjectUri = prefixifyInv(subject)
    const entity = await getEntityByUri({ uri: subjectUri })
    const subjectEntityWasUpdatedSinceDeletion = 'updated' in entity && entity.updated > patch.timestamp
    const existingClaims = entity.claims[property]
    if (existingClaims == null || !subjectEntityWasUpdatedSinceDeletion) {
      await updateInvClaim(user, subject, property, null, claimValueUri)
      warn(`recovered deleted claim: ${subjectUri} > ${property} > ${claimValueUri}`)
    } else {
      warn({ subjectUri, property, claimValueUri, existingClaims }, 'deleted claim not recovered, due existing claims')
    }
  }
}

async function findDeletionPatch (entityId: InvEntityId) {
  const patches = await getPatchesByEntityId(entityId)
  return patches
  .sort(sortAntiChronologically)
  .find(isRemovedPlaceholderPatch)
}

export function isRemovedPlaceholder (entity: SerializedEntity): entity is SerializedRemovedPlaceholder {
  return '_meta_type' in entity && entity._meta_type === 'removed:placeholder'
}

function isRemovedPlaceholderPatch (patch: Patch): patch is RemovedPlaceholderPatch {
  return 'context' in patch && 'deletedClaims' in patch.context
}
