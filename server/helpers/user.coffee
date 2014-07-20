CONFIG = require 'config'
_ = require './utils'
gravatar = require('gravatar')

db = require '../db'
H = db: require '../helpers/db'
usersDB = db.use CONFIG.db.users
Q = require 'q'
qreq = require 'qreq'

module.exports =
  db: require('../cotDb').users
  isLoggedIn: (req)->
    if req.session.email?
      _.logGreen req.session.toJSON(), 'user is logged in'
      return true
    else
      _.logRed req.session.toJSON(), 'user is not logged in'
      return false

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
        if body.rows[0]
          # IF EMAIL IS ALREADY STORED IN DB, RETURN USER EMAIL AND USERNAME
          user = _.cleanUserData body.rows[0].value
          res.cookie "email", email
          _.sendJSON res, user
        else if username? && @nameIsValid username
          # IF EMAIL IS NOT IN DB AND IF VALID USERNAME, CREATE USER
          @newUser(username, email)
          .then (body)=>
            _.logGreen body, 'new user returns'
            _.logYellow @, '@'
            user = _.cleanUserData body.value
            res.cookie "email", email
            _.sendJSON res, user
          .fail (err)-> _.errorHandler res, err
        else
          err = "Couldn't find an account associated with this email"
          _.logRed err
          _.errorHandler res, err
      .fail (err)-> _.errorHandler res, err
      .done()

    else
      _.errorHandler res, 'Persona verify status isnt okay oO: might be a problem with Persona audience setting'

  byId: (id)->
    return @db.get(id)

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
    return @db.view 'users', 'byUsername', {key: username.toLowerCase()}

  usernameStartBy: (username, options)->
    username = username.toLowerCase()
    query =
      startkey: username
      endkey: username + 'Z'
    query.limit = options.limit if options? && options.limit?
    return @db.view 'users', 'byUsername', query

  newUser: (username, email)->
    deferred = Q.defer()
    user =
      username: username
      email: email
      created: new Date()
      picture: gravatar.url(email, {d: 'mm'})
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

  getUsername: (email)->
    deferred = Q.defer()
    @byEmail(email)
    .then (res)->
      deferred.resolve res.rows[0].value.username
    .fail (err)-> deferred.reject new Error(err)
    return deferred.promise

  getUserId: (email)->
    deferred = Q.defer()
    @byEmail(email)
    .then (res)->
      deferred.resolve res.rows[0].value._id
    .fail (err)-> deferred.reject new Error(err)
    return deferred.promise

  fetchUsers: (ids)->
    deferred = Q.defer()
    usersDB.fetch {keys: ids}, (err, body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body
    return deferred.promise