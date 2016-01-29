__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'

module.exports =
  fetchUsersNearby: (req, res)->
    getNearbyUsers req
    .then (ids)->
      unless ids.length > 0 then return []
      return user_.getUsersPublicData ids
    .then _.Wrap(res, 'users')
    .catch error_.Handler(res)

  fetchItemsNearby: (req, res)->
    getNearbyUsers req
    .then (ids)->
      _.log ids, 'ids'
      unless ids.length > 0 then return [[], []]
      return promises_.all [
        user_.getUsersPublicData(ids).then _.Log('users')
        items_.publicListings(ids).then _.Log('items')
      ]
    .then _.Wraps(res, ['users', 'items'])
    .catch error_.Handler(res)


getNearbyUsers = (req)->
  parseReq req
  .spread (userId, range)->
    user_.byId userId
    .then (user)->
      { position } = user
      unless position?
        throw error_.new 'user has no position set', 400, userId

      user_.nearby position, range, userId
      .then _.Log('users nearby')

parseReq = (req)->
  { _id:userId } = req.user
  # range in kilometers
  range = req.query.range or '50'

  try range = _.stringToInt range
  catch err then return error_.reject 'invalid range', 400, [range, err]

  return promises_.resolve [userId, range]