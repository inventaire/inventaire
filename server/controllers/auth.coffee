__ = require('config').root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user'

module.exports.checkUsername = (req, res, next) ->
  reqUsername = req.body.username
  _.success reqUsername, 'checkUsername reqUsername'
  if user_.nameIsValid reqUsername
    _.success reqUsername, 'nameIsValid'
    user_.nameIsAvailable reqUsername
    .then ()->
      res.json {username: reqUsername, status: 'available'}
    .catch (err)->
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
  user_.verifyAssertion(req)
  .then (personaAnswer)->
    user_.verifyStatus personaAnswer, req, res
  .catch (err)-> _.error err, 'login err'
  .done()

module.exports.logout = (req, res, next) ->
  _.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"

module.exports.getUser = (req, res, next) ->
  user_.byEmail(req.session.email)
  .then (docs)->
    if docs?[0]?
      userData = docs[0]
      _.log userData, 'getUser'
      userId = userData._id
      user_.getUserRelations(userId)
      .then (relations)->
        _.success relations, 'relations'
        userData.relations = relations
        res.json userData
      .catch (err)->
        _.error err, 'coulnt get user relations'
        throw new Error(err)
    else
      _.errorHandler res, 'user not found', 404
  .catch (err)-> _.errorHandler res, err, 404
  .done()

module.exports.updateUser = (req, res, next) ->
  updateReq = req.body
  _.log updateReq, 'updateUser updateReq'
  user_.byEmail(req.session.email)
  .then (docs)->
    current = docs[0]
    if current.email is req.session.email and current._id is req.body._id
      unless _(current).isEqual(updateReq)
        user_.db.post(req.body)
        .then (body)-> _.getObjIfSuccess user_.db, body
        .then (body)-> res.json(body)
        .catch (err)-> _.errorHandler res, err
      else
        _.errorHandler res, 'already up-to-date', 400
    else
      _.errorHandler res, 'wrong email', 400
  .catch (err)-> _.errorHandler res, err, 400
  .done()
