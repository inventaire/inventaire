CONFIG = require 'config'
americano = require 'americano'
cookieParser = require 'cookie-parser'
session = require 'cookie-session'


# middlewares following recommandations found here for the implementation of Persona
# http://www.mircozeiss.com/mozilla-persona-example-app-with-express-and-couchdb/

restrictApiAccess = (req, res, next) ->
  if apiRoute req.originalUrl
    if req.session.email
      _.logGreen "allowed user: #{req.session.email}"
      next()
    else if whitelistedRoute req.originalUrl
      _.logGreen "whitelisted route: #{req.originalUrl}"
      next()
    else
      _.logPurple "restricted api route: #{req.originalUrl}"
      _.errorHandler res, 'unauthorized api access', 401
  else
    _.logGreen "allowed non-api route: #{req.originalUrl}"
    next()
  return

whitelistedRoute = (route)->
  return /^\/api\/auth\//.test route

apiRoute = (route)->
  return /^\/(api||test)\//.test route

allowCrossDomain = (req, res, next)->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
  res.header 'Access-Control-Allow-Headers', 'Content-Type'
  _.log 'Access-Control Policy Middleware set'
  next()

emailCookie = (req, res, next) ->
  res.cookie 'testcookie', 'cookies OK'
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

langCookie = (req, res, next) ->
  unless req.cookies?.lang?
    if lang = req.headers?['accept-language']?[0..1]
      if _.hasValue validLanguage, lang
        _.logBlue(res.cookie('lang',lang), "setting lang cookie, #{lang}")
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
    restrictApiAccess
    emailCookie
    allowCrossDomain
    cspPolicy
    # csrf
    langCookie
  ]
  development:
    use: [americano.logger('dev')]
    set:
      debug: 'on'

  production: [americano.logger('short')]