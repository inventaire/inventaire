user = require '../helpers/user'
inv = require '../helpers/inv'

module.exports.searchByUsername = (req, res, next) ->
  _.logYellow query = req._parsedUrl.query, 'search'
  user.usernameStartBy(query)
  .then (body)->
    contacts = body.rows.map (row)->
      return contact =
        _id: row.value._id
        username: row.value.username
        picture: row.value.picture
        created: row.value.created
    _.logBlue contacts, 'contacts'
    _.sendJSON res, contacts
  .fail (err)-> _.error err
  .done()


module.exports.followedData = (req, res, next) ->
  user.byEmail(req.session.email)
  .then (body)->
    return body.rows[0].value.contacts
  .then user.fetchUsers
  .then (body)->
    if body?
      usersData = _.mapCouchResult 'doc', body
      cleanedUsersData = usersData.map safeUserData
      _.sendJSON res, cleanedUsersData
    else
      _.errorHandler res, 'no contacts found', 404
  .fail (err)-> _.errorHandler res, err
  .done()

module.exports.fetchItems = (req, res, next) ->
  _.logYellow ownerId = req.params.user, 'fetchItems user'
  inv.byListing ownerId, 'contacts'
  .then (body)-> _.sendJSON res, _.mapCouchResult('value', body)


safeUserData = (value)->
  return {
    _id: value._id
    username: value.username
    created: value.created
    picture: value.picture
    contacts: value.contacts
  }