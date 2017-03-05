CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

americano = require 'americano'

auth = require './middlewares/auth'
security = require './middlewares/security'
lang = require './middlewares/lang'
statics = require './middlewares/statics'
cache = require './middlewares/cache'
logger = require './middlewares/logger'
content = require './middlewares/content'

module.exports =
  common: [
    content.redirectContentTypes
    americano.bodyParser()
    americano.methodOverride()
    americano.errorHandler
      dumpExceptions: true
      showStack: true

    statics.favicon
    logger.beforeStatic
    statics.enableCors
    statics.mountStaticFiles
    logger.afterStatic

    cache.cacheControl

    auth.cookieParser
    auth.session
    auth.passport.initialize
    auth.passport.session
    auth.basicAuth

    content.dedupplicateRequests

    security.enableCorsOnPublicApiRoutes

    lang.langCookie
  ]
  production: []
  development:
    use: [
      auth.openBarApi
      # Those headers only make sense when serving index.html
      # which is done by Nginx in production
      # (see https://github.com/inventaire/inventaire-deploy)
      security.addSecurityHeaders
      content.recoverJsonUrlencoded
    ]
    set:
      debug: 'on'
