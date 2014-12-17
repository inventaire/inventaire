CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

americano = require 'americano'
cookieParser = require 'cookie-parser'
favicon = require 'serve-favicon'
session = require 'cookie-session'
analytics = require 'no-js-analytics'

# compression should be the first use()'d
# /!\ compression may become problematic with server-sent events
# see doc https://github.com/expressjs/compression
compression = require 'compression'

Promise = require 'bluebird'
Promise.longStackTraces()  if CONFIG.promisesStackTrace

# middlewares following recommandations found here for the implementation of Persona
# http://www.mircozeiss.com/mozilla-persona-example-app-with-express-and-couchdb/

cacheControl = (req, res, next) ->
  if CONFIG.noCache
    res.header 'Cache-Control', 'no-cache, no-store, must-revalidate'
  next()


restrictApiAccess = (req, res, next) ->
  if isApiRoute req.originalUrl
    if req.session.email then next()
    else if whitelistedRoute req.originalUrl then next()
    else
      _.errorHandler res, "unauthorized api access: #{req.originalUrl}", 401
  else next()

isApiRoute = (route)-> /^\/(api|test)\//.test route

whitelistedRoute = (route)->
  new RegExp(CONFIG.whitelistedRouteRegExp).test route

allowCrossDomain = (req, res, next)->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
  res.header 'Access-Control-Allow-Headers', 'Content-Type'
  next()

policy = "default-src 'self';" +
        "frame-src 'self' https://login.persona.org;" +
        "script-src 'self' 'unsafe-inline' https://login.persona.org;" +
        "style-src 'self' 'unsafe-inline'"

cspPolicy = (req, res, next) ->
  res.header 'X-Content-Security-Policy', policy # Firefox and Internet Explorer
  res.header 'X-WebKit-CSP', policy # Safari and Chrome
  next()

csrf = (req, res, next) ->
  res.locals.token = req.session._csrf
  next()

validLanguage = ['en', 'fr', 'de']
langCookie = (req, res, next) ->
  unless req.cookies?.lang?
    if lang = req.headers?['accept-language']?[0..1]
      if lang in validLanguage
        res.cookie('lang',lang)
        _.info "setting lang cookie, #{lang}"
  next()

publicPath = __dirname + '/../client/public'
staticMiddleware = ->
  options = maxAge: CONFIG.staticMaxAge
  return americano.static publicPath, options

# function => is a function with signature (req, res, next)->
# function() => returns a function with signature (req, res, next)->
module.exports =
  common: [
    compression()
    americano.bodyParser()
    americano.methodOverride()
    americano.errorHandler
      dumpExceptions: true
      showStack: true
    americano.logger CONFIG.morganLogFormat
    ['/static', staticMiddleware()]
    favicon publicPath + '/images/favicon.ico'
    cookieParser()
    session(secret: CONFIG.secret)
    restrictApiAccess
    allowCrossDomain
    cspPolicy
    # csrf
    langCookie
    cacheControl
    analytics
  ]
  production: []
  development:
    set:
      debug: 'on'