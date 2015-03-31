CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

americano = require 'americano'

auth = require './middlewares/auth'
security = require './middlewares/security'
routes = require './middlewares/routes'
lang = require './middlewares/lang'
statics = require './middlewares/statics'
logger = require './middlewares/logger'

Promise = require 'bluebird'
Promise.longStackTraces()  if CONFIG.promisesStackTrace

module.exports =
  common: [
    security.forceSSL

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

    auth.cookieParser
    auth.session
    auth.passport.initialize
    auth.passport.session

    routes.restrictApiAccess
    # security.allowCrossDomain  #handled by the Nginx server
    # security.cspPolicy  #handled by the Nginx server
    # security.csrf  #not correctly implemented yet

    lang.langCookie
  ]
  production: []
  development:
    use: []
    set:
      debug: 'on'