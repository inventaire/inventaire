
CONFIG = require 'config'
americano = require 'americano'
cookieParser = require 'cookie-parser'
session = require 'cookie-session'


# middlewares following recommandations found here for the implementation of Persona
# http://www.mircozeiss.com/mozilla-persona-example-app-with-express-and-couchdb/

restrict = (req, res, next) ->
  if CONFIG.login
    if req.session.email
      _.logGreen "allowed user: #{req.session.email}"
      next()
    else if whitelistedRoute req.originalUrl
      _.logGreen "whitelisted route: #{req.originalUrl}"
      next()
    else if apiRoute req.originalUrl
      _.logPurple "restricted api route: #{req.originalUrl}"
      _.errorHandler res, 'unauthorized api access', 401
    else
      _.logRed "restricted: #{req.originalUrl}"
      res.redirect "/"
    return
  else next()

whitelistedRoute = (route)->
  return /^\/auth\//.test route

apiRoute = (route)->
  return /^\/api\//.test route

allowCrossDomain = (req, res, next)->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
  res.header 'Access-Control-Allow-Headers', 'Content-Type'
  _.log 'Access-Control Policy Middleware set'
  next()

emailCookie = (req, res, next) ->
  if req.session.email
    res.cookie 'email', req.session.email
  next()

policy = "default-src 'self';" +
        "frame-src 'self' https://login.persona.org;" +
        "script-src 'self' 'unsafe-inline' https://login.persona.org;" +
        "style-src 'self' 'unsafe-inline'"


cspPolicy = (req, res, next) ->
  res.header 'X-Content-Security-Policy', policy # Firefox and Internet Explorer
  res.header 'X-WebKit-CSP', policy # Safari and Chrome
  _.log 'cspPolicy headers set'
  next()

csrf = (req, res, next) ->
  res.locals.token = req.session._csrf
  next()

module.exports =
  common: [
    americano.bodyParser()
    americano.methodOverride()
    americano.errorHandler(
      dumpExceptions: true
      showStack: true
    )
    americano.static(__dirname + '/../client/public',
      maxAge: 24*60*60*1000
    )
    cookieParser()
    session(secret: CONFIG.secret)
    restrict
    emailCookie
    allowCrossDomain
    cspPolicy
    # csrf
  ]
  development:
    use: [americano.logger('dev')]
    set:
      debug: 'on'

  production: [americano.logger('short')]