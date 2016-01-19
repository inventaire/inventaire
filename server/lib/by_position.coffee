CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

module.exports = (db, designDoc)->
  return byPosition = (bbox)->
    _.log bbox, 'bbox'
    _.types bbox, 'numbers...'
    keys = getGeoSquareKeys bbox
    _.log keys, 'keys'

    db.viewKeys designDoc, 'byGeoSquare', keys, { include_docs: true }
    .then couch_.mapDoc

getGeoSquareKeys = (bbox)->
  # using the same bbox order as Leaflet bounds.toBBoxString function
  [ minLng, minLat, maxLng, maxLat ] = bbox

  latRange = [ Math.trunc(minLat)..Math.trunc(maxLat) ]
  lngRange = [ Math.trunc(minLng)..Math.trunc(maxLng) ]

  # Keep keys format in sync with Couchdb byGeoSqure views
  return _.combinations latRange, lngRange
