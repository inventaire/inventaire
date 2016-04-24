__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ fetchUsersNearby, fetchItemsNearby } = require './get_by_position'
fetchUsersItems = require './fetch_users_items'

module.exports = (req, res, next) ->
  { query } = req
  { action, ids, emails } = query
  if action?
    switch action
      when 'get-users-items' then fetchUsersItems req, res, ids
      when 'get-users-nearby' then fetchUsersNearby req, res
      when 'get-items-nearby' then fetchItemsNearby req, res
      else error_.unknownAction res
