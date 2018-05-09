__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = require '../items'
entities_ = __.require 'controllers', 'entities/lib/entities'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
buildSnapshot = require './build_snapshot'
{ getWorkAuthorsAndSeries, getEditionGraphEntities } = require './get_entities'
{ getDocData } = require './helpers'

# Working around circular dependencies
snapshot_ = null
lateRequire = -> snapshot_ = require './snapshot'
setTimeout lateRequire, 0

fromDoc = (changedEntityDoc)->
  [ uri, type ] = getDocData changedEntityDoc
  unless type in refreshTypes then return

  label = "#{uri} items snapshot refresh"

  _.info "#{label}: starting"
  getSnapshotsByType[type](uri)
  .then snapshot_.batch

fromUri = (changedEntityUri)->
  getEntityByUri changedEntityUri
  .then fromDoc

module.exports = { fromDoc, fromUri }

multiWorkRefresh = (relationProperty)-> (uri)->
  entities_.urisByClaim relationProperty, uri
  .map getSnapshotsByType.work
  .then _.flatten

getSnapshotsByType =
  edition: (uri)->
    # Get all the entities docs required to build the snapshot
    getEditionGraphEntities uri
    # Build common updated snapshot
    .spread getEditionSnapshot

  work: (uri)->
    getEntityByUri uri
    .then (work)->
      getWorkAuthorsAndSeries work
      .spread (authors, series)->
        Promise.all [
          getWorkSnapshot uri, work, authors, series
          getEditionsSnapshots uri, [ work ], authors, series
        ]
        .then _.flatten

  human: multiWorkRefresh 'wdt:P50'
  serie: multiWorkRefresh 'wdt:P179'

refreshTypes = Object.keys getSnapshotsByType

getWorkSnapshot = (uri, work, authors, series)->
  _.types arguments, [ 'string', 'object', 'array', 'array' ]
  buildSnapshot.work work, authors, series

getEditionsSnapshots = (uri, works, authors, series)->
  _.types arguments, [ 'string', 'array', 'array', 'array' ]

  entities_.byClaim 'wdt:P629', uri, true, true
  .map (edition)-> getEditionSnapshot edition, works, authors, series

getEditionSnapshot = (edition, works, authors, series)->
  _.types arguments, [ 'object', 'array', 'array', 'array' ]

  [ uri ] = getInvEntityCanonicalUri edition
  edition.uri = uri
  return buildSnapshot.edition edition, works, authors, series
