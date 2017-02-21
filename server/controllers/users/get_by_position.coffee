__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'

module.exports =
  fetchUsersNearby: (req, res)->
    getNearbyUsers req
    .then (ids)->
      unless ids.length > 0 then return []
      return user_.getUsersPublicData ids
    .then _.Wrap(res, 'users')
    .catch error_.Handler(req, res)

  fetchItemsNearby: (req, res)->
    getNearbyUsers req
    .then items_.getUsersAndItemsPublicData
    .then _.Wraps(res, ['users', 'items'])
    .catch error_.Handler(req, res)

getNearbyUsers = (req)->
  parseReq req
  .spread user_.nearby
  .then _.Log('users nearby')

parseReq = (req)->
  { _id:reqUserId } = req.user
  # range in kilometers
  range = req.query.range or '50'

  try range = _.stringToInt range
  catch err then return error_.reject 'invalid range', 400, [range, err]

  return promises_.resolve [reqUserId, range]
