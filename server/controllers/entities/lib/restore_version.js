import { emit } from 'lib/radio'
import Patch from 'models/patch'
import entities_ from './entities'
import patches_ from './patches/patches'
import validateEntity from './validate_entity'

export default async (patchId, userId) => {
  const entityId = patchId.split(':')[0]
  const restoredPatchIdNum = parseInt(patchId.split(':')[1])
  const currentDoc = await entities_.byId(entityId)
  const patches = await patches_.byEntityId(entityId)

  const patchesToRevert = patches
    .filter(patch => getPatchIdNum(patch._id) > restoredPatchIdNum)
    .sort(byDescendingPatchIdNum)

  let updatedDoc = currentDoc
  for (const patchToRevert of patchesToRevert) {
    updatedDoc = Patch.revert(updatedDoc, patchToRevert)
  }

  await validateEntity(updatedDoc)
  const context = { restoredPatch: patchId }
  const docAfterUpdate = await entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
  await emit('entity:restore:version', updatedDoc)
  return docAfterUpdate
}

const getPatchIdNum = patchId => patchId.split(':')[1]
const byDescendingPatchIdNum = (a, b) => getPatchIdNum(b._id) - getPatchIdNum(a._id)
