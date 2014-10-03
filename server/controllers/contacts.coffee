user = require '../helpers/user'
inv = require '../helpers/inv'
Q = require 'q'

module.exports.find = (req, res, next) ->
  _.logYellow query = req.query, 'contacts.find query'
  if query.action?
    switch query.action
      when 'search'
        if query.search? then return searchByUsername(res, query.search)
      when 'getusers'
        if query.ids? then return fetchUsersData(res, query.ids)

  _.errorHandler res, 'bad query', 400

searchByUsername = (res, search) ->
  user.usernameStartBy(search)
  .then (body)->
    contacts = body.rows.map (row)->
      return contact =
        _id: row.value._id
        username: row.value.username
        picture: row.value.picture
        created: row.value.created
    _.logBlue contacts, 'contacts'
    res.json contacts
  .fail (err)-> _.errorHandler res, err
  .done()

fetchUsersData = (res, ids)->
  _.logBlue ids, 'fetchUsersData ids'
  if ids?.length? and ids.length > 0
    user.getUsersPublicData(ids)
    .then (usersData)->
      _.logGreen usersData, 'usersData'
      res.json {users: usersData}
    .fail (err)-> _.errorHandler res, err, err.status
    .done()
  else
    _.errorHandler res, 'no data found', 404

module.exports.followedData = (req, res, next) ->
  user.byEmail(req.session.email)
  .then (body)->
    if body.rows.length > 0
      return body.rows[0].value.contacts
    else
      return
  .then user.fetchUsers
  .then (body)->
    if body?
      usersData = _.mapCouchResult 'doc', body
      cleanedUsersData = usersData.map user.safeUserData
      res.json cleanedUsersData
    else
      _.errorHandler res, 'no contact found', 404
  .fail (err)-> _.errorHandler res, err
  .done()


module.exports.fetchItems = (req, res, next) ->
  _.logYellow ownerId = req.params.user, 'fetchItems user'
  promises = [
    inv.byListing ownerId, 'contacts'
    inv.byListing ownerId, 'public'
  ]
  Q.spread promises, _.mergeArrays
  .then (body)-> res.json body