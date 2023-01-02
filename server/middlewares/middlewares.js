import auth from './auth.js'
import cache from './cache.js'
import content from './content.js'
import requestsLogger from './requests_logger.js'
import security from './security.js'
import statics from './statics.js'

export default [
  // Place the request logger first so that even requests that generate an error
  // in the middleware are logged
  requestsLogger,

  security.setCorsPolicy,

  // server/controllers/auth/fake_submit.js relies on the possibility
  // to submit a url encoded form data, so it needs to have the body-parser ready for it
  content.acceptUrlencoded('/api/submit'),

  // OAuth clients might send urlencoded content
  content.acceptUrlencoded('/api/oauth/token'),

  content.jsonBodyParser,
  statics.favicon,
  statics.mountStaticFiles,

  cache.cacheControl,

  auth.cookieParser,
  auth.session,
  auth.enforceSessionMaxAge,
  auth.passport.initialize,
  auth.passport.session,
  auth.authorizationHeader,

  content.deduplicateRequests,
]
