_ = require('config').root.require('builders', 'utils')

user = require '../lib/user'
inv = require '../lib/inv'
Promise = require 'bluebird'

module.exports.actions = (req, res, next) ->
  _.log query = req.query, 'users.actions query'
  if query.action?
    switch query.action
      when 'search'
        if query.search? then return searchByUsername(res, query.search)
      when 'getusers'
        if query.ids? then return fetchUsersData(res, query.ids)

  _.errorHandler res, 'bad query', 400

searchByUsername = (res, search) ->
  user.usernameStartBy(search)
  .then (usersData)->
    users = usersData.map user.safeUserData
    _.info users, 'users'
    res.json users
  .fail (err)-> _.errorHandler res, err
  .done()

fetchUsersData = (res, ids)->
  _.info ids, 'fetchUsersData ids'
  if ids?.length? and ids.length > 0
    user.getUsersPublicData(ids, 'index')
    .then (usersData)->
      _.success usersData, 'usersData'
      res.json {users: usersData}
    .fail (err)-> _.errorHandler res, err
    .done()
  else
    _.errorHandler res, 'no data found', 404

module.exports.friendData = (req, res, next) ->
  user.byEmail(req.session.email)
  .then (docs)->
    if docs.length > 0 then return docs[0].users
    else return
  .then user.fetchUsers.bind(user)
  .then (body)->
    _.log body, 'fetchUsers body'
    if body?
      usersData = _.mapCouchDoc body
      cleanedUsersData = usersData.map user.safeUserData
      res.json cleanedUsersData
    else
      _.errorHandler res, 'no user found', 404
  .fail (err)-> _.errorHandler res, err
  .done()


module.exports.fetchItems = (req, res, next) ->
  _.log ownerId = req.params.user, 'fetchItems user'
  promises = [
    inv.byListing ownerId, 'friends'
    inv.byListing ownerId, 'public'
  ]
  Promise.all(promises)
  .spread _.union
  .then (body)-> res.json body