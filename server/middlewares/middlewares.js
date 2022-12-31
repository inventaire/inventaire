import auth from './auth'
import security from './security'
import statics from './statics'
import cache from './cache'
import requestsLogger from './requests_logger'
import content from './content'

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
