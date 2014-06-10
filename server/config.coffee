CONFIG = require('config')
americano = require("americano")
cookieParser = require('cookie-parser')
session = require('cookie-session')

module.exports =
  common: [
    americano.bodyParser()
    americano.methodOverride()
    americano.errorHandler(
      dumpExceptions: true
      showStack: true
    )
    americano.static(__dirname + "/../client/public",
      maxAge: 24*60*60*1000
    )
    cookieParser()
    session(secret: CONFIG.secret)
    (req, res, next) ->
      console.log req.session.toJSON()
      if req.session.email
        res.cookie 'email', req.session.email
        console.log 'req.session.email => cookie!!'
        console.log req.session.email
      else
        console.log 'no email, no cookie'
      next()
  ]
  development:
    use: [americano.logger("dev")]
    set:
      debug: "on"

  production: [americano.logger("short")]
