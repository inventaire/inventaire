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
  entities_.byIds [fromId, toId]
  .spread (fromEntityDoc, toEntityDoc)->
    # At this point if the entities are not found, that's the server's fault, thus the 500 status
    unless fromEntityDoc._id is fromId then throw error_.new "'from' entity doc not found", 500
    unless toEntityDoc._id is toId then throw error_.new "'to' entity doc not found", 500

    toEntityDocBeforeMerge = _.cloneDeep toEntityDoc
    toEntityDoc = Entity.mergeDocs fromEntityDoc, toEntityDoc

    entities_.putUpdate userId, toEntityDocBeforeMerge, toEntityDoc
    .then -> turnIntoRedirection userId, fromId, "inv:#{toId}"

turnIntoRedirection = (userId, fromId, toUri)->
  _.types arguments, 'strings...'

  fromUri = "inv:#{fromId}"

  entities_.byId fromId
  .then (currentFromDoc)->
    updatedFromDoc = Entity.turnEntityIntoRedirection currentFromDoc, toUri
    return entities_.putUpdate userId, currentFromDoc, updatedFromDoc
  .then propagateRedirection.bind(null, userId, fromUri, toUri)

propagateRedirection = (userId, fromUri, toUri)->
  promises_.all [
    redirectClaims userId, fromUri, toUri
    updateItemEntityAfterEntityMerge fromUri, toUri
  ]

module.exports = { merge, turnIntoRedirection }
