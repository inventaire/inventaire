CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

module.exports = (db, designDoc)->
  return byPosition = (bbox)->
    _.log bbox, 'bbox'
    _.types bbox, 'numbers...'

    console.time 'geo square keys'
    keys = getGeoSquareKeys bbox
    console.timeEnd 'geo square keys'
    # _.log keys, 'keys'

    db.viewKeys designDoc, 'byGeoSquare', keys, { include_docs: true }
    .then couch_.mapDoc

getGeoSquareKeys = (bbox)->
  # Using the same bbox order as Leaflet bounds.toBBoxString function.
  # Use Math.floor and not Math.trunc as they have different behaviors
  # on negative numbers: Math.floor(-2.512) => -3 /// Math.trunc(-2.512) => -2
  [ minLng, minLat, maxLng, maxLat ] = bbox.map Math.floor

  latRange = [ minLat..maxLat ]
  lngRange = [ minLng..maxLng ]

  # Keep keys format in sync with Couchdb byGeoSquare views
  return _.combinations latRange, lngRange
