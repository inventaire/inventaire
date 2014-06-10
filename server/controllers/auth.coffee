db = require('../db').use('inventaire')
request = require "request"
audience = require('config').fullHost

module.exports.login = (req, resp, next) ->
  console.log "req****************"
  console.log req
  console.log "req.session**********"
  console.log req.session.toJSON()
  request.post
    url: "https://verifier.login.persona.org/verify"
    json:
      assertion: req.body.assertion
      audience: audience
  , (err, res, body) ->
    console.log err  if err
    if body.status is "okay"
      email = body.email
      console.log "body.email*************"
      console.log email
      req.session.email = email
      console.log "req.session.email***************"
      console.log req.session.email

      # check if email is already saved in db
      db.view "users", "byEmail", {key: email}, (err, body) ->
        console.log err  if err
        console.log "body****************"
        console.log body
        unless body.rows[0]
          # email is not in db
          user =
            type: "user"
            email: email
            username: ""

          db.insert user, (err, body) ->
            console.log err  if err
            resp.send 200
        else
          # email is already stored in db
          resp.send 200



  # # console.log "req.session.emails"
  # # console.log req.session.email
  # hello =
  #   welcome: "hello"
  # res.send JSON.stringify(hello)


module.exports.logout = (req, res, next) ->
  console.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"