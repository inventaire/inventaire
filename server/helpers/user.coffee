CONFIG = require 'config'
_ = require './utils'
gravatar = require('gravatar')

db = require '../db'
H = db: require '../helpers/db'
usersDB = db.use CONFIG.db.users
Q = require 'q'
qreq = require 'qreq'

module.exports =
  isLoggedIn: (req)->
    _.logBlue "IMPLEMENT ME", 'isLoggedIn'

  redirectToLogin: (req, res)->
    res.status '302'
    res.redirect '/login'

  verifyAssertion: (req)->
    console.log 'verifyAssertion'
    params =
      url: "https://verifier.login.persona.org/verify"
      json:
        assertion: req.body.assertion
        audience: CONFIG.fullHost()
    return qreq.post params

  verifyStatus: (personaAnswer, req, res) ->
    _.logYellow personaAnswer.body, 'personaAnswer.body'
    body = personaAnswer.body
    req.session.username = username = req.body.username
    req.session.email = email = body.email

    if body.status is "okay"
      # CHECK IF EMAIL IS IN DB
      @byEmail(email)
      .then (body)=>
        console.log @
        if body.rows[0]
          # IF EMAIL IS ALREADY STORED IN DB, RETURN USER EMAIL AND USERNAME
          user = _.cleanUserData body.rows[0].value
          _.sendJSON res, user
        else if username? && @nameIsValid username
          # IF EMAIL IS NOT IN DB AND IF VALID USERNAME, CREATE USER
          @newUser(username, email)
          .then (body)=>
            _.logGreen body, 'new user returns'
            _.logYellow @, '@'
            user = _.cleanUserData body.value
            _.sendJSON res, user
          .fail (err)-> _.errorHandler res, err

        else
          err = "Couldn't find an account associated with this email"
          _.logRed err
          _.errorHandler res, err

    else
      _.errorHandler res, 'Persona verify status isnt okay oO: might be a problem with Persona audience setting'

  byEmail: (email)->
    deferred = Q.defer()
    usersDB.view "users", "byEmail", {key: email}, (err, body) ->
      if err
        deferred.reject new Error('CouchDB problem with byEmail method: ' + err)
      else
        deferred.resolve body
    return deferred.promise

  nameIsValid: (username)->
    /^\w{1,20}$/.test username

  nameIsAvailable: (username)->
    deferred = Q.defer()
    @byUsername(username)
    .then (body)->
      if body.rows.length == 0
        _.logGreen username, 'available'
        deferred.resolve username
      else
        _.logRed username, 'not available'
        deferred.reject new Error('This username already exists')
    return deferred.promise

  byUsername: (username)->
    deferred = Q.defer()
    usersDB.view "users", "byUsername", {key: username.toLowerCase()}, (err, body) ->
      if err
        deferred.reject new Error('CouchDB problem with byUsername method: ' + err)
      else
        deferred.resolve body
    return deferred.promise

  newUser: (username, email)->
    deferred = Q.defer()
    user =
      username: username
      email: email
      created: new Date()
      pic: gravatar.url(email, {d: 'mm'})
    _.logBlue user, 'new user'
    usersDB.insert user, (err, body) ->
      if err
        deferred.reject new Error('CouchDB problem with newUser method: ' + err)
      else
        body.value = user
        deferred.resolve body
    return deferred.promise


  deleteUser: (user)->
    _.logBlue user, 'deleteUser'
    deferred = Q.defer()
    usersDB.destroy user._id, user._rev, (err,body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body
    return deferred.promise

  deleteUserByUsername: (username)->
    _.logBlue username, 'deleteUserbyUsername'
    @byUsername(username)
    .then (body)->
      return body.rows[0].value
    .then @deleteUser
    .fail (err)-> _.logRed err, 'deleteUserbyUsername err'