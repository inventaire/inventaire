const _ = require('builders/utils')
const error_ = require('lib/error/error')
const entities_ = require('./entities')
const patches_ = require('./patches')
const placeholders_ = require('./placeholders')
const updateItemEntity = require('controllers/items/lib/update_entity')
const { revertFromPatchDoc } = require('./revert_edit')

module.exports = async (userId, fromId) => {
  const patches = await patches_.getWithSnapshots(fromId)
  const targetVersion = await findVersionBeforeRedirect(patches)
  const currentVersion = await entities_.byId(fromId)
  const toUri = currentVersion.redirect
  const fromUri = `inv:${fromId}`
  targetVersion._id = currentVersion._id
  targetVersion._rev = currentVersion._rev
  targetVersion.version = currentVersion.version

  const updateRes = await entities_.putUpdate({
    userId,
    currentDoc: currentVersion,
    updatedDoc: targetVersion
  })

  await updateItemEntity.afterRevert(fromUri, toUri)
  await recoverPlaceholders(userId, currentVersion.removedPlaceholdersIds)
  await revertMergePatch(userId, fromUri, toUri)
  await revertClaimsRedirections(userId, fromUri)

  return updateRes
}

const findVersionBeforeRedirect = patches => {
  const versions = _.map(patches, 'snapshot')
  const lastVersion = _.last(versions)
  if (lastVersion.redirect == null) {
    throw error_.new("last version isn't a redirection", 400, lastVersion)
  }

  return versions
  .filter(isntRedirection)
  // Take the last
  .slice(-1)[0]
}

const isntRedirection = version => version.redirect == null

const recoverPlaceholders = async (userId, removedPlaceholdersIds) => {
  if (removedPlaceholdersIds == null || removedPlaceholdersIds.length === 0) return

  const recoverFn = placeholders_.recover.bind(null, userId)
  return Promise.all(removedPlaceholdersIds.map(recoverFn))
}

const revertMergePatch = async (userId, fromUri, toUri) => {
  const [ prefix, toId ] = toUri.split(':')
  if (prefix !== 'inv') return

  const patches = await patches_.byEntityId(toId)

  const mergePatch = patches.find(patch => {
    return patch.context && patch.context.mergeFrom === fromUri
  })

  if (mergePatch == null) {
    // This happens when the merged entity didn't bring any label or claim
    // value that the merge target hadn't already
    _.warn({ fromUri, toUri }, 'no merge patch found')
    return
  }

  return revertFromPatchDoc(mergePatch, userId)
}

const revertClaimsRedirections = async (userId, fromUri) => {
  const patches = await patches_.byRedirectUri(fromUri)
  return Promise.all(patches.map(patch => revertFromPatchDoc(patch, userId)))
}
