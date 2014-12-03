CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user'
promises_ = __.require 'lib', 'promises'

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
  verifyAssertion(req)
  .then (personaAnswer)->
    verifyStatus personaAnswer, req, res
  .catch (err)-> _.error err, 'login err'
  .done()

module.exports.logout = (req, res, next) ->
  _.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"


verifyAssertion = (req)->
  _.info 'verifyAssertion'
  params =
    url: "https://verifier.login.persona.org/verify"
    json:
      assertion: req.body.assertion
      audience: CONFIG.fullHost()
  _.log params.json.audience, 'persona audience requested'
  return promises_.post params

verifyStatus = (personaAnswer, req, res) ->
  _.log personaAnswer, 'personaAnswer'
  username = req.body.username
  req.session.email = email = personaAnswer.email

  if personaAnswer.status is "okay"
    # CHECK IF EMAIL IS IN DB
    user_.byEmail(email)
    .then (docs)->
      if docs[0]
        # IF EMAIL IS ALREADY STORED IN DB, RETURN USER EMAIL AND USERNAME
        user = user_.cleanUserData docs[0]
        res.cookie "email", email
        res.json user
      else if username? and user_.nameIsValid username
        # IF EMAIL IS NOT IN DB AND IF VALID USERNAME, CREATE USER
        user_.newUser(username, email)
        .then (body)->
          res.cookie "email", email
          res.json body
        .catch (err)-> _.errorHandler res, err
      else
        err = "Couldn't find an account associated with this email"
        throw err
    .catch (err)-> _.errorHandler res, err
    .done()

  else
    err = 'Persona verify status isnt okay oO: might be a problem with Persona audience setting'
    _.errorHandler res, err