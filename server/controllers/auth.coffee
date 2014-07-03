user = require '../helpers/user'

module.exports.checkUsername = (req, res, next) ->
  reqUsername = req.body.username
  _.logGreen reqUsername
  if user.nameIsValid reqUsername
    _.logBlue reqUsername, 'nameIsValid'
    user.nameIsAvailable reqUsername
    .then(
      ()-> _.sendJSON res, {username: reqUsername, status: 'available'}, 200
      , ()-> _.sendJSON res, {username: reqUsername, status: 'not available'}, 400
      )
    .fail (err)-> _.logRed err
    .done()
  else
    _.logRed reqUsername, 'nameIsntValid'
    body =
      username: reqUsername
      status: 'invalid'
      status_verbose: 'invalid username'
    _.sendJSON res, body, 400

module.exports.login = (req, res, next) ->
  user.verifyAssertion(req)
  .then (personaAnswer)->
    user.verifyStatus personaAnswer, req, res
  .fail (err)-> _.logRed err
  .done()

module.exports.logout = (req, res, next) ->
  console.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"