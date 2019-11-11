CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

routes = require './routes'
auth = require './auth'
security = require './security'
statics = require './statics'
cache = require './cache'
logger = require './logger'
content = require './content'

module.exports =
  common: [
    # Place the logger first so that even requests that generate an error
    # in the middleware are logged
    logger

    routes.legacyApiRedirect
    routes.methodOverride
    content.fakeSubmitException
    content.jsonBodyParser
    statics.favicon

    statics.enableCors
    statics.mountStaticFiles

    cache.cacheControl

    auth.cookieParser
    auth.session
    auth.passport.initialize
    auth.passport.session
    auth.basicAuth

    content.deduplicateRequests

    security.enableCorsOnPublicApiRoutes
  ]
  production: []
  dev: [
    # Those headers only make sense when serving index.html
    # which is done by Nginx in production
    # (see https://github.com/inventaire/inventaire-deploy)
    security.addSecurityHeaders
  ]
