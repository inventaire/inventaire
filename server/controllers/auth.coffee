user = require '../helpers/user'

module.exports.checkUsername = (req, res, next) ->
  reqUsername = req.body.username
  _.logGreen reqUsername, 'checkUsername reqUsername'
  if user.nameIsValid reqUsername
    _.logGreen reqUsername, 'nameIsValid'
    user.nameIsAvailable reqUsername
    .then ()->
      _.sendJSON res, {username: reqUsername, status: 'available'}, 200
    .fail (err)->
      obj =
        username: reqUsername
        status: 'not available'
        status_verbose: "this username isn't available"
        err: err
      _.sendJSON res, obj, 400
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
  .fail (err)-> _.logRed err, 'login err'
  .done()

module.exports.logout = (req, res, next) ->
  console.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"

module.exports.getUser = (req, res, next) ->
  user.byEmail(req.session.email)
  .then (body)->
    userData = body.rows[0].value
    _.logYellow userData, 'getUser'
    _.sendJSON res, userData
  .fail (err)-> _.errorHandler res, err, 404
  .done()

module.exports.updateUser = (req, res, next) ->
  updateReq = req.body
  _.logYellow updateReq, 'updateUser updateReq'
  user.byEmail(req.session.email)
  .then (body)->
    current = body.rows[0].value
    if current.email == req.session.email && current._id == req.body._id
      if _.hasDiff current, updateReq
        user.db.post(req.body)
        .then (body)-> _.getObjIfSuccess user.db, body
        .then (body)-> _.sendJSON res, body
        .fail (err)-> _.errorHandler res, err
      else
        _.errorHandler res, 'already up-to-date', 400
    else
      _.errorHandler res, 'wrong email', 400
  .fail (err)-> _.errorHandler res, err, 400
  .done()
