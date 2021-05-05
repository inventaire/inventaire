// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const CONFIG = require('config')
const { deduplicateRequests } = CONFIG
const { logBody: logIncomingRequestsBody } = CONFIG.incomingRequests
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const bodyParser = require('body-parser')

module.exports = {
  // Assume JSON content-type for, among others:
  // - application/json
  // - application/x-www-form-urlencoded (used by /bin/curl and jquery default)
  // - application/csp-report
  // While thus not parse properly urlencoded content, preserving from CSRF attacks
  // cf https://fosterelli.co/dangerous-use-of-express-body-parser
  // Not using '*/*' as this would include multipart/form-data
  // used for image upload
  jsonBodyParser: bodyParser.json({ type: 'application/*', limit: '5mb' }),
  // server/controllers/auth/fake_submit.js relies on the possibility
  // to submit a url encoded form data, so it needs to have the body-parser ready for it,
  // otherwise it throws a 'SyntaxError: Unexpected token # in JSON at position 0' error
  // This middleware will only apply for requests on the '/api/submit' endpoint
  fakeSubmitException: [
    '/api/submit',
    bodyParser.urlencoded({ extended: false })
  ],

  // Assumes that a requests made twice with the same body within 2 secondes
  // is an erronous request that should be blocked
  deduplicateRequests: (req, res, next) => {
    if (!deduplicateRequests) return next()

    const { method, url } = req
    if (!methodsWithBody.includes(method)) return next()

    const { pathname } = req._parsedUrl
    if (ignorePathname.includes(pathname)) return next()

    // If the request as no session cookie, simply use a hash of the header
    // Different users might have the same but users using Basic Auth will be distincts
    // so it only let unauthentified POST/PUT requests with the exact same body at risk
    // of unjustified request denial, which should be a rather small risk
    const sessionId = (req.cookies && req.cookies['express:sess.sig']) || headersHash(req)

    // Known case with an empty body:
    // - image upload: its using application/octet-stream header instead of json
    //   thus body-parser won't populate req.body
    const data = _.hashCode(JSON.stringify(req.body || {}))

    const key = `${sessionId}:${method}:${url}`
    const previousData = requestsCache[key]

    if (data === previousData) {
      return error_.bundle(req, res, 'duplicated request', 429, [ key, req.body ])
    }

    temporaryLock(key, data)

    if (logIncomingRequestsBody) _.log(req.body, `${method}:${url} body`)

    next()
  }
}

const headersHash = req => _.hashCode(JSON.stringify(req.headers))

const temporaryLock = (key, data) => {
  requestsCache[key] = data
  // Unlock after 2 secondes
  const unlock = () => { requestsCache[key] = null }
  setTimeout(unlock, 2000)
}

// can be problematic in cluster mode as it won't be shared between instances
const requestsCache = {}

const methodsWithBody = [ 'POST', 'PUT' ]
const ignorePathname = [
  '/api/reports'
]
