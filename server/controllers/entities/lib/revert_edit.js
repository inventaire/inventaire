const __ = require('config').universalPath
const Patch = __.require('models', 'patch')
const entities_ = require('./entities')
const patches_ = require('./patches')

const revertFromPatchDoc = async (patch, userId) => {
  const entityId = patch._id.split(':')[0]
  const currentDoc = await entities_.byId(entityId)
  const updatedDoc = Patch.revert(currentDoc, patch)
  const context = { revertPatch: patch._id }
  return entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
}

const revertFromPatchId = async (patchId, userId) => {
  const patch = await patches_.byId(patchId)
  return revertFromPatchDoc(patch, userId)
}

module.exports = { revertFromPatchDoc, revertFromPatchId }
