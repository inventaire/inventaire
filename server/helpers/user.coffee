db = require('../db')
usersDB = db.use 'users'
_ = require '../helpers/utils'
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

      _.logYellow email, 'email and'
      _.logPurple req.session.email, 'req.session.email should be the same'

      # check if email is already saved in db
      usersDB.view "users", "byEmail", {key: email}, (err, body) ->
        console.log err  if err
        _.log body, 'body'
        unless body.rows[0]
          # email is not in db
          user =
            type: "user"
            email: email
            username: ""

          usersDB.insert user, (err, body) ->
            console.log err if err
            resp.send 200
        else
          # email is already stored in db
          resp.send 200
    else
      _.logRed 'DOH again'