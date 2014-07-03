CONFIG = require 'config'

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
    _.logRed 'verify assertion'
    params =
      url: "https://verifier.login.persona.org/verify"
      json:
        assertion: req.body.assertion
        audience: CONFIG.fullHost()
    return qreq.post params

  verifyStatus: (personaAnswer, req, res) ->
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
          _.sendJSON res, body.rows[0]
        else if username? && @nameIsValid username
          # IF EMAIL IS NOT IN DB AND IF VALID USERNAME, CREATE USER
          @newUser(username, email)
          .then _.sendJSON
          .fail _.errorHandler

        else
          err = "mmh, might had a problem with Username, you might need to restart the SignIn process"
          _.logRed err
          _.errorHandler err

    else
      _.logRed 'DOH again'
      _.errorHandler 'Persona verify status isnt okay oO'


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
        _.logGreen username, 'not available'
        deferred.reject new Error('This username already exists')

  byUsername: (username)->
    deferred = Q.defer()
    usersDB.view "users", "byUsername", {key: username}, (err, body) ->
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
    usersDB.insert user, (err, body) ->
      if err
        deferred.reject new Error('CouchDB problem with newUser method: ' + err)
      else
        deferred.resolve body
    return deferred.promise