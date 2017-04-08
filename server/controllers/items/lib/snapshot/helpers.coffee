__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = require '../items'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
Item = __.require 'models', 'item'

module.exports =
  getDocData: (updatedDoc)->
    [ uri ] = getInvEntityCanonicalUri updatedDoc
    type = getEntityType updatedDoc.claims['wdt:P31']
    return [ uri, type ]

  bulkUpdateTitle: (updateTitle)-> (items)->
    if items.length is 0 then return
    updatedItems = items.map Item.updateSnapshotTitle.bind(null, updateTitle)
    return items_.db.bulk updatedItems
