// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

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

  content.fakeSubmitException,
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
  auth.basicAuth,

  content.deduplicateRequests,

  security.enableCorsOnPublicApiRoutes
]
