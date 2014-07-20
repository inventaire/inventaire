user = require '../helpers/user'

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
  .then (couchData)->
    usersData = couchData.rows.map (el)-> el.doc
    cleanedUsersData = usersData.map _.safeUserData
    _.logBlue cleanedUsersData
    return cleanedUsersData
  .then (usersData)->
    _.logGreen usersData, 'usersData'
    _.sendJSON res, usersData
  .fail (err)-> _.errorHandler res, err
  .done()