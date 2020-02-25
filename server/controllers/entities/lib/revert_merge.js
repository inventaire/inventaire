const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
let entities_ = require('./entities')
const patches_ = require('./patches')
const placeholders_ = require('./placeholders')
const updateItemEntity = __.require('controllers', 'items/lib/update_entity')
entities_ = require('./entities')
const Patch = __.require('models', 'patch')

module.exports = async (userId, fromId) => {
  const patches = await patches_.getSnapshots(fromId)
  const targetVersion = await findVersionBeforeRedirect(patches)
  const currentVersion = await entities_.byId(fromId)
  const toUri = currentVersion.redirect
  const fromUri = `inv:${fromId}`
  targetVersion._id = currentVersion._id
  targetVersion._rev = currentVersion._rev

  const updateRes = entities_.putUpdate({
    userId,
    currentDoc: currentVersion,
    updatedDoc: targetVersion
  })

  await updateItemEntity.afterRevert(fromUri, toUri)
  await recoverPlaceholders(userId, currentVersion.removedPlaceholdersIds)
  await revertMergePatch(userId, fromUri, toUri)
  await revertClaimsRedirections(userId, fromUri, toUri)

  return updateRes
}

const findVersionBeforeRedirect = patches => {
  const versions = patches.map(_.property('snapshot'))
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

const revertMergePatch = (userId, fromUri, toUri) => {
  const [ prefix, toId ] = toUri.split(':')
  if (prefix !== 'inv') return

  return Promise.all([
    entities_.byId(toId),
    patches_.byEntityId(toId)
  ])
  .then(([ currentDoc, patches ]) => {
    const mergePatch = patches.find(patch => {
      return patch.context && patch.context.mergeFrom === fromUri
    })

    if (mergePatch == null) {
      // This happens when the merged entity didn't bring any label or claim
      // value that the merge target hadn't already
      _.warn({ fromUri, toUri }, 'no merge patch found')
      return
    }

    const updatedDoc = Patch.revert(currentDoc, mergePatch)
    const context = { revertPatch: mergePatch._id }
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
  })
}

const revertClaimsRedirections = (userId, fromUri, toUri) => {
  return patches_.byRedirectUri(fromUri)
  .map(revertClaimsRedirectionFromPatch(userId))
}

const revertClaimsRedirectionFromPatch = userId => patch => {
  const entityId = patch._id.split(':')[0]
  return entities_.byId(entityId)
  .then(currentDoc => {
    const updatedDoc = Patch.revert(currentDoc, patch)
    const context = { revertPatch: patch._id }
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
  })
}
