__ = require('config').universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
items_ = require './items'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
Item = __.require 'models', 'item'

module.exports = ->
  radio.on 'entity:update:label', updateSnapshotOnLabelChange
  radio.on 'entity:update:claim', updateSnapshotOnClaimChange

updateSnapshotOnLabelChange = (updatedDoc, lang, value)->
  [ uri, type ] = getDocData updatedDoc
  switch type
    when 'work' then updateWorksTitles uri, lang, value

updateWorksTitles = (uri, lang, value)->
  items_.byEntity uri
  .filter (item)-> item.lang is lang
  .then bulkUpdateTitle(value)

updateSnapshotOnClaimChange = (updatedDoc, property, oldVal, newVal)->
  [ uri, type ] = getDocData updatedDoc
  switch type
    when 'edition'
      if property is 'wdt:P1476' then updateEditionsTitles uri, newVal

updateEditionsTitles = (uri, newVal)->
  items_.byEntity uri
  .then bulkUpdateTitle(newVal)

getDocData = (updatedDoc)->
  [ uri ] = getInvEntityCanonicalUri updatedDoc
  type = getEntityType updatedDoc.claims['wdt:P31']
  return [ uri, type ]

bulkUpdateTitle = (updateTitle)-> (items)->
  if items.length is 0 then return
  updatedItems = items.map Item.updateSnapshotTitle.bind(null, updateTitle)
  return items_.db.bulk updatedItems
