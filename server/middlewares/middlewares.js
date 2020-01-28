const auth = require('./auth')
const security = require('./security')
const statics = require('./statics')
const cache = require('./cache')
const requestsLogger = require('./requests_logger')
const content = require('./content')

module.exports = {
  common: [
    // Place the request logger first so that even requests that generate an error
    // in the middleware are logged
    requestsLogger,

    content.fakeSubmitException,
    content.jsonBodyParser,
    statics.favicon,

    statics.enableCors,
    statics.mountStaticFiles,

    cache.cacheControl,

    auth.cookieParser,
    auth.session,
    auth.passport.initialize,
    auth.passport.session,
    auth.basicAuth,

    content.deduplicateRequests,

    security.enableCorsOnPublicApiRoutes
  ],
  production: [],
  dev: [
    // Those headers only make sense when serving index.html
    // which is done by Nginx in production
    // (see https://github.com/inventaire/inventaire-deploy)
    security.addSecurityHeaders
  ]
}
