__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user'
items_ = __.require 'lib', 'items'
Promise = require 'bluebird'

module.exports.actions = (req, res, next) ->
  _.log query = req.query, 'users.actions query'
  if query.action?
    switch query.action
      when 'search'
        if query.search? then return searchByUsername(res, query.search)
      when 'getusers'
        if query.ids? then return fetchUsersData(res, query.ids)
      when 'getitems'
        if query.ids? then return fetchUsersItems(req, res, query.ids)

  _.errorHandler res, 'bad query', 400

searchByUsername = (res, search) ->
  user_.usernameStartBy(search)
  .then (usersData)->
    users = usersData.map user_.safeUserData
    _.info users, 'users'
    res.json users
  .catch (err)-> _.errorHandler res, err

fetchUsersData = (res, ids)->
  _.info ids, 'fetchUsersData ids'
  ids = ids.split('|')
  if ids?.length > 0 and validUserIds(ids)
    user_.getUsersPublicData(ids, 'index')
    .then (usersData)->
      _.success usersData, 'usersData'
      res.json {users: usersData}
    .catch (err)-> _.errorHandler res, err
    .done()
  else
    _.errorHandler res, 'unvalid ids', 400

validUserIds = (ids)-> _.all ids, (id)-> /^\w{32}$/.test(id)

module.exports.friendData = (req, res, next) ->
  user_.byEmail(req.session.email)
  .then (docs)->
    if docs.length > 0 then return docs[0].users
    else return
  .then user_.fetchUsers.bind(user)
  .then (body)->
    _.log body, 'fetchUsers body'
    if body?
      usersData = _.mapCouchDoc body
      cleanedUsersData = usersData.map user_.safeUserData
      res.json cleanedUsersData
    else
      _.errorHandler res, 'no user found', 404
  .catch (err)-> _.errorHandler res, err


fetchUsersItems = (req, res, ids) ->
  _.info ids = ids.split('|'), 'fetchUsersItems users'
  user_.getUserId(req.session.email)
  .then (userId)-> user_.getRelationsStatuses(userId, ids)
  .then (res)->
    _.log res, '[friends, public]'
    [friends, others] = res
    # not fetching others items
    return _.combinations friends, ['friends', 'public']
  .then (listings)-> items_.batchByListings listings
  .then (body)-> res.json body