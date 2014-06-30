db = require('../db')
usersDB = db.use 'users'
request = require "request"
audience = require('config').fullHost
Q = require 'q'
qreq = require 'qreq'
_ = require '../helpers/utils'

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
        audience: audience
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

  newUser: (username, email)->
    deferred = Q.defer()
    usersDB.insert user, (err, body) ->
      if err
        deferred.reject new Error('CouchDB: ' + err)
      else
        deferred.resolve body
    return deferred.promise