__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
patches_ = require './patches'
placeholders_ = require './placeholders'
updateItemEntity = __.require 'controllers', 'items/lib/update_entity'

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

      entities_.putUpdate userId, currentVersion, targetVersion
      .tap -> updateItemEntity.afterRevert fromUri, toUri
      .tap -> recoverPlaceholders currentVersion.removedPlaceholdersIds
      .tap -> alertOnPossibleClaimsToReveryManually fromUri, toUri

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

alertOnPossibleClaimsToReveryManually = (fromUri, toUri)->
  entities_.byClaimsValue toUri
  .then (results)->
    if results.length is 0 then return
    _.log results, "claims using #{toUri} but that might need to be reverted to #{fromUri}", 'red'
