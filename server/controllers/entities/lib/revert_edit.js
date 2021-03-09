const Patch = require('models/patch')
const entities_ = require('./entities')
const patches_ = require('./patches')
const validateEntity = require('./validate_entity')

const revertFromPatchDoc = async (patch, userId) => {
  const entityId = patch._id.split(':')[0]
  const currentDoc = await entities_.byId(entityId)
  const updatedDoc = Patch.revert(currentDoc, patch)
  await validateEntity(updatedDoc)
  const context = { revertPatch: patch._id }
  return entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
}

const revertFromPatchId = async (patchId, userId) => {
  const patch = await patches_.byId(patchId)
  return revertFromPatchDoc(patch, userId)
}

module.exports = { revertFromPatchDoc, revertFromPatchId }
