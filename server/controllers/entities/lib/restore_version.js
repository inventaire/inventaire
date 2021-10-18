const Patch = require('models/patch')
const entities_ = require('./entities')
const patches_ = require('./patches')
const validateEntity = require('./validate_entity')

module.exports = async (patchId, userId) => {
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
  return entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
}

const getPatchIdNum = patchId => patchId.split(':')[1]
const byDescendingPatchIdNum = (a, b) => getPatchIdNum(b._id) - getPatchIdNum(a._id)
