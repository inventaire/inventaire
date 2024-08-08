import { getEntityById, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { getPatchById } from '#controllers/entities/lib/patches/patches'
import { emit } from '#lib/radio'
import { retryOnConflict } from '#lib/retry_on_conflict'
import { revertPatch } from '#models/patch'
import { validateInvEntity } from './validate_entity.js'

async function _revertFromPatchDoc (patch, userId) {
  const entityId = patch._id.split(':')[0]
  const currentDoc = await getEntityById(entityId)
  const updatedDoc = revertPatch(currentDoc, patch)
  await validateInvEntity(updatedDoc)
  const context = { revertPatch: patch._id }
  const docAfterUpdate = await putInvEntityUpdate({ userId, currentDoc, updatedDoc, context })
  await emit('entity:revert:edit', updatedDoc)
  return docAfterUpdate
}

export async function revertFromPatchId (patchId, userId) {
  const patch = await getPatchById(patchId)
  return revertFromPatchDoc(patch, userId)
}

export const revertFromPatchDoc = retryOnConflict(_revertFromPatchDoc)
