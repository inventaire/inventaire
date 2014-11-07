__ = require('config').root
_ = __.require('builders', 'utils')

user = __.require 'lib', 'user'

module.exports.checkUsername = (req, res, next) ->
  reqUsername = req.body.username
  _.success reqUsername, 'checkUsername reqUsername'
  if user.nameIsValid reqUsername
    _.success reqUsername, 'nameIsValid'
    user.nameIsAvailable reqUsername
    .then ()->
      res.json {username: reqUsername, status: 'available'}
    .fail (err)->
      obj =
        username: reqUsername
        status: 'not available'
        status_verbose: "this username isn't available"
        err: err
      res.json 400, obj
    .done()
  else
    _.error reqUsername, 'nameIsntValid'
    obj =
      username: reqUsername
      status: 'invalid'
      status_verbose: 'invalid username'
    res.json 400, obj

module.exports.login = (req, res, next) ->
  user.verifyAssertion(req)
  .then (personaAnswer)->
    user.verifyStatus personaAnswer, req, res
  .fail (err)-> _.error err, 'login err'
  .done()

module.exports.logout = (req, res, next) ->
  _.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"

module.exports.getUser = (req, res, next) ->
  user.byEmail(req.session.email)
  .then (body)->
    if body?.rows?[0]?
      userData = body.rows[0].value
      _.log userData, 'getUser'
      userId = userData._id
      user.getUserRelations(userId)
      .then (relations)->
        _.success relations, 'relations'
        userData.relations = relations
        res.json userData
      .catch (err)->
        _.error err, 'coulnt get user relations'
        throw new Error(err)
    else
      _.errorHandler res, 'user not found', 404
  .fail (err)-> _.errorHandler res, err, 404
  .done()

module.exports.updateUser = (req, res, next) ->
  updateReq = req.body
  _.log updateReq, 'updateUser updateReq'
  user.byEmail(req.session.email)
  .then (body)->
    current = body.rows[0].value
    if current.email is req.session.email and current._id is req.body._id
      unless _(current).isEqual(updateReq)
        user.db.post(req.body)
        .then (body)-> _.getObjIfSuccess user.db, body
        .then (body)-> res.json(body)
        .fail (err)-> _.errorHandler res, err
      else
        _.errorHandler res, 'already up-to-date', 400
    else
      _.errorHandler res, 'wrong email', 400
  .fail (err)-> _.errorHandler res, err, 400
  .done()
