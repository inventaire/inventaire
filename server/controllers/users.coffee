__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'lib', 'items'
error_ = __.require 'lib', 'error/error'

module.exports.publicActions = (req, res, next) ->
  { query } = req
  { action, search } = query
  if action?
    switch action
      when 'search' then searchByUsername res, search
      else error_.unknownAction res

module.exports.actions = (req, res, next) ->
  { query } = req
  { action, ids, emails } = query
  if action?
    switch action
      when 'get-users' then fetchUsersData res, ids
      when 'get-users-by-emails' then fetchUsersDataByEmails res, emails
      when 'get-items'then fetchUsersItems req, res, ids
      else error_.unknownAction res

searchByUsername = (res, search) ->
  unless search?
    return error_.bundle res, 'bad query', 400, query

  user_.usernameStartBy(search)
  .then (usersData)->
    users = usersData.map user_.publicUserData
    res.json users
  .catch error_.Handler(res)

fetchUsersData = (res, ids)->
  promises_.start()
  .then parseAndValidateIds.bind(null, ids)
  .then _.partialRight(user_.getUsersPublicData, 'index')
  .then sendUsersData.bind(null, res)
  .catch error_.Handler(res)

fetchUsersDataByEmails = (res, emails)->
  emails = emails.split '|'
  user_.publicUsersDataByEmails emails
  .then sendUsersData.bind(null, res)
  .catch error_.Handler(res)

sendUsersData = (res, usersData)->
  res.json {users: usersData}

fetchUsersItems = (req, res, ids) ->
  userId = req.user._id

  promises_.start()
  .then parseAndValidateIds.bind(null, ids)
  .then user_.getRelationsStatuses.bind(null, userId)
  .then (res)->
    [friends, coGroupMembers] = res
    # not fetching non-friends non-coGroupMembers items
    return networkIds = _.uniq coGroupMembers.concat(friends)
  .then items_.bundleListings.bind(null, ['friends', 'public'])
  .then res.json.bind(res)
  .catch error_.Handler(res)

parseAndValidateIds = (ids)->
  ids = ids.split '|'
  if ids?.length > 0 and validUserIds(ids) then return ids
  else throw error_.new 'invalid ids', 400, ids

validUserIds = (ids)-> _.all ids, (id)-> /^\w{32}$/.test(id)
