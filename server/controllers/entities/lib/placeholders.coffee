# Placeholders are entities automatically created without checking that a similar
# entity existed locally or in Wikidata. Those entities have thus high chances
# to be duplicates and to be deleted by merge operations.

# But mistakes happen, and some merges will need to be reverted:
# thus the remove/recover mechanism hereafter

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
Entity = __.require 'models', 'entity'

PlaceholderHandler = (modelFnName)-> (userId, entityId)->
  _.warn entityId, "#{modelFnName} entity"
  # Using db.get anticipates a possible future where db.byId filtes-out
  # non type='entity' docs, thus making type='removed:placeholder' not accessible
  entities_.db.get entityId
  .then (currentDoc)->
    updatedDoc = Entity[modelFnName](currentDoc)
    entities_.putUpdate userId, currentDoc, updatedDoc
    .then -> return currentDoc._id

module.exports =
  remove: PlaceholderHandler 'removePlaceholder'
  recover: PlaceholderHandler 'recoverPlaceholder'
