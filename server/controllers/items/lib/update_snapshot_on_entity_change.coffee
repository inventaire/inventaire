__ = require('config').universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
items_ = require './items'
entities_ = __.require 'controllers','entities/lib/entities'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
Item = __.require 'models', 'item'
{ getAuthorsEntities, getAuthorsNamesString, getNamesStringFromAuthorsEntities } = require('./snapshot_helpers')
{ Promise } = __.require 'lib', 'promises'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'

# Items keep some data about their related entities, and those entities graphs
# to make querying items quick, while keeping the required data at end
# to display basic information on the given item.
# This is sort of a caching system, with all the problems related to updating
# cached data.
# The strategy here:
# - update local entities snapshot data directly on change
# - update remote entities snapshot data once in a while:
#   Wikidata's data is assumed to be more reliable, and less changing

module.exports = ->
  radio.on 'entity:update:label', updateSnapshotOnLabelChange
  radio.on 'entity:update:claim', updateSnapshotOnClaimChange

updateSnapshotOnLabelChange = (updatedDoc, lang, value)->
  [ uri, type ] = getDocData updatedDoc
  switch type
    when 'work' then updateWorksTitles uri, lang, value
    when 'human' then updateAuthorsNames uri

updateWorksTitles = (uri, lang, value)->
  items_.byEntity uri
  .filter (item)-> item.lang is lang
  .then bulkUpdateTitle(value)
  .catch _.Error('updateWorksTitles err')

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

updateAuthorsNames = (uri)->
  # Updating all the items that have a work from this author for entity
  # or an edition of one of those works
  entities_.byClaim 'wdt:P50', uri, true, true
  .map updateWorkAndEditionsAuthors
  .then _.flatten
  .then (updatedItems)->
    if updatedItems.length > 0 then items_.db.bulk updatedItems
  .catch _.Error('updateAuthorsNames err')

updateWorkAndEditionsAuthors = (workDoc)->
  workUri = "inv:#{workDoc._id}"
  Promise.all [
    getAuthorsEntities workDoc.claims['wdt:P50']
    getEditions workUri
  ]
  .spread (authorsEntities, editionsDoc)->
    Promise.all [
      getWorkUpdatedItems workUri, authorsEntities
      getEditionsUpdatedItems(editionsDoc, authorsEntities)
    ]
    .then _.flatten

getEditions = (workUri)-> entities_.byClaim 'wdt:P629', workUri, true, true

getWorkUpdatedItems = (workUri, authorsEntities)->
  items_.byEntity workUri
  .map (item)->
    lang = item.lang or 'en'
    authorsString = getNamesStringFromAuthorsEntities lang, authorsEntities
    item.snapshot['entity:authors'] = authorsString
    return item

getEditionsUpdatedItems = (editionsDoc, authorsEntities)->
  Promise.all editionsDoc.map(getEditionUpdatedItems(authorsEntities))
  .then _.flatten

getEditionUpdatedItems = (authorsEntities)-> (editionDoc)->
  [ editionUri ] = getInvEntityCanonicalUri editionDoc
  items_.byEntity editionUri
  .map (item)->
    lang = getOriginalLang(editionDoc.claims) or 'en'
    authorsString = getNamesStringFromAuthorsEntities lang, authorsEntities
    item.snapshot['entity:authors'] = authorsString
    return item
