__ = require('config').universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
items_ = require '../items'
entities_ = __.require 'controllers','entities/lib/entities'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
Item = __.require 'models', 'item'
{ Promise } = __.require 'lib', 'promises'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'

updateAuthorsNames = require './update_authors_names'
{ getDocData, bulkUpdateTitle } = require './helpers'

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
