__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
{ publicUsersData } = __.require 'lib', 'user/public_user_data'
{ StringNumber } = __.require 'models', 'tests/regex'
SendUsersData = require './lib/send_users_data'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'lib', 'items'
error_ = __.require 'lib', 'error/error'

module.exports = (res, query) ->
  promises_.start()
  .then parseLatLng.bind(null, query)
  .then user_.byPosition
  .then publicUsersData
  .then SendUsersData(res)
  .catch error_.Handler(res)

parseLatLng = (query)->
  { lat, lng } = query

  unless lat? then throw paramErr 'missing', 'lat', query
  unless lng? then throw paramErr 'missing', 'lng', query

  # lat and lng will be parsed from url query as strings
  # but we want to make sure those are actually stringified numbers
  unless StringNumber.test(lat) then throw paramErr 'invalid', 'lat', query
  unless StringNumber.test(lng) then throw paramErr 'invalid', 'lng', query

  lat = Number lat
  lng = Number lng
  return [ lat, lng ]

paramErr = (label, param, query)->
  error_.new "#{label} #{param} parameter", 400, query
