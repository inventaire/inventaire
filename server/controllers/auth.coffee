user = require '../helpers/user'
_ = require '../helpers/utils'

module.exports.username = (req, res, next) ->
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

module.exports.login = (req, resp, next) ->
  user.verifyAssertion(req)
  .then (answer)->
    user.verifyStatus answer, req, resp
  .fail (err)-> _.logRed err
  .done()

module.exports.logout = (req, res, next) ->
  console.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"