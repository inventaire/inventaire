# this module is doomed to be replaced by a geobox parser
# to fit search_by_positions needs: keeping it as a placeholder

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ StringNumber } = __.require 'models', 'tests/regex'

parseLatLng = (query)->
  { bbox } = query

  unless bbox?
    return error_.reject 'missing bbox parameter', 400, query

  try
    bbox = JSON.parse bbox
    _.types bbox, 'numbers...', 4
  catch err
    return error_.reject 'invalid bbox', 400, query

  [ minLng, minLat, maxLng, maxLat ] = bbox
  _.log bbox, 'minLng, minLat, maxLng, maxLat'

  unless minLng < maxLng and minLat < maxLat
    return error_.reject 'invalid bbox coordinates', 400

  # not throwing an error when a coordinate is over its limit
  # but replacing it by the limit to make following calculations lighter
  if minLng < -180 then minLng = -180
  if maxLng > 180 then maxLng = 180
  if minLat < -90 then minLat = -90
  if maxLng > 90 then maxLng = 90

  return [ minLng, minLat, maxLng, maxLat ]

module.exports = (query)->
  promises_.start
  .then parseLatLng.bind(null, query)
