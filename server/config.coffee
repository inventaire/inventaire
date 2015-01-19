CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

americano = require 'americano'
cookieParser = require 'cookie-parser'
session = require 'cookie-session'
analytics = require 'no-js-analytics'

security = require './middlewares/security'
routes = require './middlewares/routes'
lang = require './middlewares/lang'
statics = require './middlewares/statics'
logger = require './middlewares/logger'

# compression should be the first use()'d
# /!\ compression may become problematic with server-sent events
# see doc https://github.com/expressjs/compression
compression = require 'compression'

Promise = require 'bluebird'
Promise.longStackTraces()  if CONFIG.promisesStackTrace

module.exports =
  common: [
    security.forceSSL
    compression()

    # MUST be before middlewares using _.errorHandler
    logger.sendServerErrorsClientSide
    americano.bodyParser()
    americano.methodOverride()
    americano.errorHandler
      dumpExceptions: true
      showStack: true

    logger.beforeStatic
    statics.mountStaticFiles
    statics.favicon
    logger.afterStatic
    statics.cacheControl

    cookieParser()
    session {secret: CONFIG.secret}
    routes.restrictApiAccess
    security.allowCrossDomain
    security.cspPolicy
    # security.csrf

    lang.langCookie
    analytics
  ]
  production: []
  development:
    use: [
      logger.sendServerErrorsClientSide
    ]
    set:
      debug: 'on'