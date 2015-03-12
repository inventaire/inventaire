__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'lib', 'items'
Promise = require 'bluebird'

module.exports.actions = (req, res, next) ->
  {query} = req
  {action, search, ids} = query
  if action?
    switch action
      when 'search'
        if search? then return searchByUsername(res, search)
      when 'getusers'
        if ids? then return fetchUsersData(res, ids)
      when 'getitems'
        if ids? then return fetchUsersItems(req, res, ids)

  _.errorHandler res, 'bad query', 400

searchByUsername = (res, search) ->
  user_.usernameStartBy(search)
  .then (usersData)->
    users = usersData.map user_.safeUserData
    res.json users
  .catch (err)-> _.errorHandler res, err

fetchUsersData = (res, ids)->
  ids = ids.split('|')
  if ids?.length > 0 and validUserIds(ids)
    user_.getUsersPublicData(ids, 'index')
    .then (usersData)->
      res.json {users: usersData}
    .catch (err)-> _.errorHandler res, err
    .done()
  else
    _.errorHandler res, 'unvalid ids', 400

validUserIds = (ids)-> _.all ids, (id)-> /^\w{32}$/.test(id)

fetchUsersItems = (req, res, ids) ->
  ids = ids.split '|'
  user_.getUserId(req)
  .then (userId)-> user_.getRelationsStatuses(userId, ids)
  .then (res)->
    [friends, others] = res
    # not fetching others items
    return _.combinations friends, ['friends', 'public']
  .then (listings)-> items_.batchByListings listings
  .then (body)-> res.json body