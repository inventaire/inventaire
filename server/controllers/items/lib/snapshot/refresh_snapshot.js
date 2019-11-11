__ = require('config').universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
entities_ = __.require 'controllers', 'entities/lib/entities'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
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
  getEntityByUri { uri: changedEntityUri }
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
    getEntityByUri { uri }
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
  assert_.types [ 'string', 'object', 'array', 'array' ], arguments
  buildSnapshot.work work, authors, series

getEditionsSnapshots = (uri, works, authors, series)->
  assert_.types [ 'string', 'array', 'array', 'array' ], arguments

  entities_.urisByClaim 'wdt:P629', uri
  .then (uris)-> getEntitiesByUris { uris }
  .then (res)-> _.values res.entities
  .map (edition)-> getEditionSnapshot edition, works, authors, series

getEditionSnapshot = (edition, works, authors, series)->
  assert_.types [ 'object', 'array', 'array', 'array' ], arguments
  # Expects a formatted edition
  assert_.string edition.uri
  return buildSnapshot.edition edition, works, authors, series
