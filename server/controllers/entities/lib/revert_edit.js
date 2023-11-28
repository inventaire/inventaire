import { getEntityById, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { getPatchById } from '#controllers/entities/lib/patches/patches'
import { emit } from '#lib/radio'
import Patch from '#models/patch'
import validateEntity from './validate_entity.js'

export async function revertFromPatchDoc (patch, userId) {
  const entityId = patch._id.split(':')[0]
  const currentDoc = await getEntityById(entityId)
  const updatedDoc = Patch.revert(currentDoc, patch)
  await validateEntity(updatedDoc)
  const context = { revertPatch: patch._id }
  const docAfterUpdate = await putInvEntityUpdate({ userId, currentDoc, updatedDoc, context })
  await emit('entity:revert:edit', updatedDoc)
  return docAfterUpdate
}

export async function revertFromPatchId (patchId, userId) {
  const patch = await getPatchById(patchId)
  return revertFromPatchDoc(patch, userId)
}
