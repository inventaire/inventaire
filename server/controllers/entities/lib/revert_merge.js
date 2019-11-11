__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
patches_ = require './patches'
placeholders_ = require './placeholders'
updateItemEntity = __.require 'controllers', 'items/lib/update_entity'
entities_ = require './entities'
Patch = __.require 'models', 'patch'

module.exports = (userId, fromId)->
  patches_.getSnapshots fromId
  .then findVersionBeforeRedirect
  .then (targetVersion)->
    entities_.byId fromId
    .then (currentVersion)->
      toUri = currentVersion.redirect
      fromUri = "inv:#{fromId}"
      targetVersion._id = currentVersion._id
      targetVersion._rev = currentVersion._rev

      entities_.putUpdate
        userId: userId
        currentDoc: currentVersion
        updatedDoc: targetVersion
      .tap -> updateItemEntity.afterRevert fromUri, toUri
      .tap -> recoverPlaceholders userId, currentVersion.removedPlaceholdersIds
      .tap -> revertMergePatch userId, fromUri, toUri
      .tap -> revertClaimsRedirections userId, fromUri, toUri

findVersionBeforeRedirect = (patches)->
  versions = patches.map _.property('snapshot')
  lastVersion = _.last versions
  unless lastVersion.redirect?
    throw error_.new "last version isn't a redirection", 400, lastVersion

  return versions
  .filter isntRedirection
  # Take the last
  .slice(-1)[0]

isntRedirection =  (version)-> not version.redirect?

recoverPlaceholders = (userId, removedPlaceholdersIds)->
  unless removedPlaceholdersIds?.length > 0 then return promises_.resolved

  recoverFn = placeholders_.recover.bind(null, userId)
  return promises_.all removedPlaceholdersIds.map(recoverFn)

revertMergePatch = (userId, fromUri, toUri)->
  [ prefix, toId ] = toUri.split ':'
  if prefix isnt 'inv' then return

  promises_.all [
    entities_.byId toId
    patches_.byEntityId toId
  ]
  .spread (currentDoc, patches)->
    mergePatch = patches.find (patch)-> patch.context?.mergeFrom is fromUri
    unless mergePatch?
      # This happens when the merged entity didn't bring any label or claim
      # value that the merge target hadn't already
      _.warn { fromUri, toUri }, 'no merge patch found'
      return

    updatedDoc = Patch.revert currentDoc, mergePatch
    context = { revertPatch: mergePatch._id }
    return entities_.putUpdate { userId, currentDoc, updatedDoc, context }

revertClaimsRedirections = (userId, fromUri, toUri)->
  patches_.byRedirectUri fromUri
  .map revertClaimsRedirectionFromPatch(userId)

revertClaimsRedirectionFromPatch = (userId)-> (patch)->
  entityId = patch._id.split(':')[0]
  entities_.byId entityId
  .then (currentDoc)->
    updatedDoc = Patch.revert currentDoc, patch
    context = { revertPatch: patch._id }
    return entities_.putUpdate { userId, currentDoc, updatedDoc, context }
