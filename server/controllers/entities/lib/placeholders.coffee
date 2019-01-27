# Placeholders are entities automatically created without checking that a similar
# entity existed locally or in Wikidata. Those entities have thus high chances
# to be duplicates and to be deleted by merge operations.

# But mistakes happen, and some merges will need to be reverted:
# thus the remove/recover mechanism hereafter

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
Entity = __.require 'models', 'entity'
radio = __.require 'lib', 'radio'

PlaceholderHandler = (actionName)->
  modelFnName = "#{actionName}Placeholder"
  return (userId, entityId)->
    _.warn entityId, "#{modelFnName} entity"
    # Using db.get anticipates a possible future where db.byId filters-out
    # non type='entity' docs, thus making type='removed:placeholder' not accessible
    entities_.db.get entityId
    .then (currentDoc)->
      try
        updatedDoc = Entity[modelFnName](currentDoc)
      catch err
        if err.message is "can't turn a redirection into a removed placeholder"
          # Ignore this error as the effects of those two states are close
          # (so much so that it might be worth just having redirections)
          _.warn currentDoc, err.message
          return
        else
          throw err

      entities_.putUpdate { userId, currentDoc, updatedDoc }
      .then -> return currentDoc._id
    .tap -> radio.emit "entity:#{actionName}", "inv:#{entityId}"

module.exports =
  remove: PlaceholderHandler 'remove'
  recover: PlaceholderHandler 'recover'
