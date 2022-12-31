import { emit } from 'lib/radio'
import Patch from 'models/patch'
import entities_ from './entities'
import patches_ from './patches/patches'
import validateEntity from './validate_entity'

const revertFromPatchDoc = async (patch, userId) => {
  const entityId = patch._id.split(':')[0]
  const currentDoc = await entities_.byId(entityId)
  const updatedDoc = Patch.revert(currentDoc, patch)
  await validateEntity(updatedDoc)
  const context = { revertPatch: patch._id }
  const docAfterUpdate = await entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
  await emit('entity:revert:edit', updatedDoc)
  return docAfterUpdate
}

const revertFromPatchId = async (patchId, userId) => {
  const patch = await patches_.byId(patchId)
  return revertFromPatchDoc(patch, userId)
}

export default { revertFromPatchDoc, revertFromPatchId }
