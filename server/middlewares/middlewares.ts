import auth from './auth.js'
import { acceptUrlencoded, jsonBodyParser, deduplicateRequests } from './content.js'
import requestsLogger from './requests_logger.js'
import security from './security.js'
import { favicon, mountStaticFiles } from './statics.js'

export default [
  // Place the request logger first so that even requests that generate an error
  // in the middleware are logged
  requestsLogger,

  security.setCorsPolicy,

  // OAuth clients might send urlencoded content
  acceptUrlencoded('/api/oauth/token'),

  jsonBodyParser,
  favicon,
  mountStaticFiles,

  auth.cookieParser,
  auth.session,
  auth.enforceSessionMaxAge,
  auth.passport.initialize,
  auth.passport.session,
  auth.authorizationHeader,

  deduplicateRequests,
]
