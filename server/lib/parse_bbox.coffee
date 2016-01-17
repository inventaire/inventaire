# this module is doomed to be replaced by a geobox parser
# to fit search_by_positions needs: keeping it as a placeholder

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ StringNumber } = __.require 'models', 'tests/regex'

parseLatLng = (query)->
  { lat, lng } = query

  unless lat? then throw paramErr 'missing', 'lat', query
  unless lng? then throw paramErr 'missing', 'lng', query

  # lat and lng will be parsed from url query as strings
  # but we want to make sure those are actually stringified numbers
  unless StringNumber.test(lat) then throw paramErr 'invalid', 'lat', query
  unless StringNumber.test(lng) then throw paramErr 'invalid', 'lng', query

  return [ lat, lng ].map Number

paramErr = (label, param, query)->
  error_.new "#{label} #{param} parameter", 400, query

module.exports = (query)->
  # return a promise
  promises_.start()
  .then parseLatLng.bind(null, query)
