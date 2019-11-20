const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
let entities_ = require('./entities')
const patches_ = require('./patches')
const placeholders_ = require('./placeholders')
const updateItemEntity = __.require('controllers', 'items/lib/update_entity')
entities_ = require('./entities')
const Patch = __.require('models', 'patch')

module.exports = (userId, fromId) => {
  return patches_.getSnapshots(fromId)
  .then(findVersionBeforeRedirect)
  .then(targetVersion => entities_.byId(fromId)
  .then(currentVersion => {
    const toUri = currentVersion.redirect
    const fromUri = `inv:${fromId}`
    targetVersion._id = currentVersion._id
    targetVersion._rev = currentVersion._rev

    return entities_.putUpdate({
      userId,
      currentDoc: currentVersion,
      updatedDoc: targetVersion
    })
    .tap(() => updateItemEntity.afterRevert(fromUri, toUri))
    .tap(() => recoverPlaceholders(userId, currentVersion.removedPlaceholdersIds))
    .tap(() => revertMergePatch(userId, fromUri, toUri))
    .tap(() => revertClaimsRedirections(userId, fromUri, toUri))
  }))
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

const recoverPlaceholders = (userId, removedPlaceholdersIds) => {
  if ((removedPlaceholdersIds != null ? removedPlaceholdersIds.length : undefined) <= 0) return promises_.resolved

  const recoverFn = placeholders_.recover.bind(null, userId)
  return promises_.all(removedPlaceholdersIds.map(recoverFn))
}

const revertMergePatch = (userId, fromUri, toUri) => {
  const [ prefix, toId ] = toUri.split(':')
  if (prefix !== 'inv') return

  return promises_.all([
    entities_.byId(toId),
    patches_.byEntityId(toId)
  ])
  .spread((currentDoc, patches) => {
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
