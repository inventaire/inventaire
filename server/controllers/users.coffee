__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'lib', 'items'
error_ = __.require 'lib', 'error/error'

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

  error_.bundle res, 'bad query', 400, query

searchByUsername = (res, search) ->
  user_.usernameStartBy(search)
  .then (usersData)->
    users = usersData.map user_.safeUserData
    res.json users
  .catch error_.Handler(res)

fetchUsersData = (res, ids)->
  ids = ids.split('|')
  unless ids?.length > 0 and validUserIds(ids)
    return error_.bundle res, 'invalid ids', 400, ids

  user_.getUsersPublicData(ids, 'index')
  .then (usersData)->
    res.json {users: usersData}
  .catch error_.Handler(res)


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
  .then res.json.bind(res)
  .catch error_.Handler(res)
