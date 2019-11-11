CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
assert_ = __.require 'utils', 'assert_types'

module.exports = (db, designDoc)-> (bbox)->
  assert_.numbers bbox
  keys = getGeoSquareKeys bbox

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
