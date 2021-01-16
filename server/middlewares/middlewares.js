const auth = require('./auth')
const security = require('./security')
const statics = require('./statics')
const cache = require('./cache')
const requestsLogger = require('./requests_logger')
const content = require('./content')

module.exports = [
  // Place the request logger first so that even requests that generate an error
  // in the middleware are logged
  requestsLogger,

  // server/controllers/auth/fake_submit.js relies on the possibility
  // to submit a url encoded form data, so it needs to have the body-parser ready for it
  content.acceptUrlencoded('/api/submit'),

  // OAuth clients might send urlencoded content
  content.acceptUrlencoded('/api/oauth/token'),

  content.jsonBodyParser,
  statics.favicon,

  statics.enableCors,
  statics.mountStaticFiles,

  cache.cacheControl,

  auth.cookieParser,
  auth.session,
  auth.enforceSessionMaxAge,
  auth.passport.initialize,
  auth.passport.session,
  auth.authorizationHeader,

  content.deduplicateRequests,

  security.enableCorsOnPublicApiRoutes
]
