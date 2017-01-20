__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
entities_ = require './entities'
updateItemEntityAfterEntityMerge = __.require 'controllers', 'items/lib/update_entity_after_entity_merge'
Entity = __.require 'models', 'entity'
redirectClaims = require './redirect_claims'

merge = (userId, fromId, toId)->
  _.types arguments, 'strings...'

  # Fetching non-formmatted docs
  entities_.byIds [fromId, toId]
  .spread (fromEntityDoc, toEntityDoc)->
    # At this point if the entities are not found, that's the server's fault, thus the 500 statusCode
    unless fromEntityDoc._id is fromId then throw error_.new "'from' entity doc not found", 500
    unless toEntityDoc._id is toId then throw error_.new "'to' entity doc not found", 500

    # Transfer all data from the 'fromEntity' to the 'toEntity'
    # if any difference can be found
    toEntityDocBeforeMerge = _.cloneDeep toEntityDoc
    toEntityDoc = Entity.mergeDocs fromEntityDoc, toEntityDoc
    if _.eq toEntityDoc, toEntityDocBeforeMerge
      # if the toEntityDoc after data transfer hasn't changed
      # don't run entities_.putUpdate as it will throw an 'empty patch' error
      transfer = promises_.resolved
    else
      transfer = entities_.putUpdate userId, toEntityDocBeforeMerge, toEntityDoc

    transfer
    .then -> turnIntoRedirection userId, fromId, "inv:#{toId}"

turnIntoRedirection = (userId, fromId, toUri)->
  _.types arguments, 'strings...'

  fromUri = "inv:#{fromId}"

  entities_.byId fromId
  .then (currentFromDoc)->
    updatedFromDoc = Entity.turnEntityIntoRedirection currentFromDoc, toUri
    entities_.putUpdate userId, currentFromDoc, updatedFromDoc
    # Using the currentFromDoc and not the updated doc as we need its claims before the redirection
    # to find the entities that might now not be referenced anymore
    .tap -> deleteObsoletePlaceholderEntities userId, currentFromDoc
    # If author has no more links to it delete it
  .then propagateRedirection.bind(null, userId, fromUri, toUri)

# Removing the entities that were needed only by the entity about to be turned into a redirection:
# this entity now don't have anymore reason to be and is quite probably a dupplicate of an existing entity
# referenced by the redirection destination entity.
deleteObsoletePlaceholderEntities = (userId, entityDocBeforeRedirection)->
  entityUrisToCheck = getEntityUrisToCheck entityDocBeforeRedirection.claims
  _.log entityUrisToCheck, 'entityUrisToCheck'
  return promises_.all entityUrisToCheck.map(deleteIfIsolated(userId))

getEntityUrisToCheck = (claims)->
  _(claims)
  .pick propertiesToCheckForPlaceholderDeletion
  .values()
  # Merge properties arrays
  .flatten()
  .uniq()
  .value()

propertiesToCheckForPlaceholderDeletion = [
  # author
  'wdt:P50'
]

deleteIfIsolated = (userId)-> (entityUri)->
  [ prefix, entityId ] = entityUri.split ':'
  # Ignore wd or isbn entities
  unless prefix is 'inv' then return

  entities_.byClaimsValue entityUri
  .then (results)->
    if results.length is 0 then return entities_.deletePlaceholder userId, entityId

propagateRedirection = (userId, fromUri, toUri)->
  promises_.all [
    redirectClaims userId, fromUri, toUri
    updateItemEntityAfterEntityMerge fromUri, toUri
  ]

module.exports = { merge, turnIntoRedirection }
