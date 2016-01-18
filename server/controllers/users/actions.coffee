__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
SendUsersData = require './lib/send_users_data'
User = __.require 'models', 'user'

module.exports = (req, res, next) ->
  { query } = req
  { action, ids, emails } = query
  if action?
    switch action
      when 'get-users' then fetchUsersData res, ids
      when 'get-items'then fetchUsersItems req, res, ids
      else error_.unknownAction res

fetchUsersData = (res, ids)->
  promises_.start
  .then parseAndValidateIds.bind(null, ids)
  .then _.partialRight(user_.getUsersPublicData, 'index')
  .then SendUsersData(res)
  .catch error_.Handler(res)

fetchUsersItems = (req, res, ids) ->
  userId = req.user._id

  promises_.start
  .then parseAndValidateIds.bind(null, ids)
  .then user_.getRelationsStatuses.bind(null, userId)
  .then (res)->
    [friends, coGroupMembers] = res
    # not fetching non-friends non-coGroupMembers items
    return networkIds = _.uniq coGroupMembers.concat(friends)
  .then items_.friendsListings
  .then res.json.bind(res)
  .catch error_.Handler(res)

parseAndValidateIds = (ids)->
  ids = ids.split '|'
  if ids?.length > 0 and validUserIds(ids) then return ids
  else throw error_.new 'invalid ids', 400, ids

validUserIds = (ids)-> _.all ids, User.tests.userId
