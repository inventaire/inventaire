CONFIG = require 'config'
_ = require '../helpers/utils'
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

  verifyStatus: (answer, req, resp) ->
    body = answer.body
    if body.status is "okay"
      req.session.email = email = body.email
      # check if email is already saved in db
      @byEmail(email)
      .then (body)->
        unless body.rows[0]
          # email is not in db
          @newUser(username, email)
          .then _.sendJSON
          .fail _.errorHandler
        else
          # email is already stored in db
          _.sendJSON resp, body.rows[0]
    else
      _.logRed 'DOH again'
      _.errorHandler 'verify status isnt okay'


  byEmail: (email)->
    deferred = Q.defer()
    usersDB.view "users", "byEmail", {key: email}, (err, body) ->
      if err
        deferred.reject new Error('CouchDB: ' + err)
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
        deferred.reject new Error('CouchDB: ' + err)
      else
        deferred.resolve body
    return deferred.promise

  newUser: (username, email)->
    deferred = Q.defer()
    user =
      username: username
      email: email
    usersDB.insert user, (err, body) ->
      if err
        deferred.reject new Error('CouchDB: ' + err)
      else
        deferred.resolve body
    return deferred.promise