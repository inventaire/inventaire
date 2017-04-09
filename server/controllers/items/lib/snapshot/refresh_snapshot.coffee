__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = __.require 'controllers','entities/lib/entities'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
buildSnapshot = require './build_snapshot'
{ getWorkAuthors, getEditionGraphEntities } = require './get_entities'
{ getDocData } = require './helpers'
items_ = require '../items'

fromDoc = (changedEntityDoc)->
  [ uri, type ] = getDocData changedEntityDoc
  unless type in refreshTypes then return

  refresh[type](uri)
  .then (updatedItems)->
    if updatedItems?.length > 0 then items_.db.bulk updatedItems

  .catch _.Error('refresh snapshot err')

fromUri = (changedEntityUri)->
  getEntityByUri changedEntityUri
  .then fromDoc

module.exports = { fromDoc, fromUri }

refresh =
  edition: (uri)->
    # Get all the entities docs required to build the snapshot
    getEditionGraphEntities uri
    # Build common updated snapshot
    .spread getUpdatedEditionItems

  work: (uri)->
    getEntityByUri uri
    .then (work)->
      getWorkAuthors work
      .then (authors)->
        Promise.all [
          getUpdatedWorkItems uri, work, authors
          getUpdatedEditionsItems uri, work, authors
        ]
        .then _.flatten

  human: (uri)->
    entities_.urisByClaim 'wdt:P50', uri
    .map refresh.work
    .then _.flatten

refreshTypes = Object.keys refresh

getUpdatedWorkItems = (uri, work, authors)->
  items_.byEntity uri
  .map (item)->
    { lang } = item
    updatedSnapshot = buildSnapshot.work lang, work, authors
    if _.objDiff item.snapshot, updatedSnapshot
      item.snapshot = updatedSnapshot
      return item
    else
      return null
  # Filter out items without snapshot change
  .filter _.identity

getUpdatedEditionsItems = (uri, work, authors)->
  entities_.byClaim 'wdt:P629', uri, true, true
  .map (edition)-> getUpdatedEditionItems edition, work, authors
  # Keep only items that had a change
  .filter _.identity
  .then _.flatten

getUpdatedEditionItems = (edition, work, authors)->
  [ uri ] = getInvEntityCanonicalUri edition
  updatedSnapshot = buildSnapshot.edition edition, work, authors
  # Find all edition items
  items_.byEntity uri
  .then (items)->
    unless items.length > 0 then return
    if _.objDiff items[0].snapshot, updatedSnapshot
      # Update snapshot
      return items.map(addSnapshot(updatedSnapshot))

addSnapshot = (updatedSnapshot)-> (item)->
  item.snapshot = updatedSnapshot
  return item
