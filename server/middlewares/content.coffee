CONFIG = require 'config'
{ deduplicateRequests } = CONFIG
{ debug } = CONFIG
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports =
  # Assume JSON content-type for, among others:
  # - application/json
  # - application/x-www-form-urlencoded (used by /bin/curl and jquery default)
  # - application/csp-report
  # While thus not parse properly urlencoded content, preserving from CSRF attacks
  # cf https://fosterelli.co/dangerous-use-of-express-body-parser
  # Not using '*/*' as this would include multipart/form-data
  # used for image upload
  jsonBodyParser: require('body-parser').json { type: 'application/*'}
  # server/controllers/auth/fake_submit.coffee relies on the possibility
  # to submit a url encoded form data, so it needs to have the body-parser ready for it,
  # otherwise it throws a 'SyntaxError: Unexpected token # in JSON at position 0' error
  # This middleware will only apply for requests on the '/api/submit' endpoint
  fakeSubmitException: [
    '/api/submit',
    require('body-parser').urlencoded { extended: false }
  ]

  # Assumes that a requests made twice with the same body within 2 secondes
  # is an erronous request that should be blocked
  deduplicateRequests: (req, res, next)->
    unless deduplicateRequests then return next()

    { method, url } = req
    unless method in methodsWithBody then return next()

    { pathname } = req._parsedUrl
    if pathname in ignorePathname then return next()

    # If the request as no session cookie, simply use a hash of the header
    # Different users might have the same but users using Basic Auth will be distincts
    # so it only let unauthentified POST/PUT requests with the exact same body at risk
    # of unjustified request denial, which should be a rather small risk
    sessionId = req.cookies?['express:sess.sig'] or headersHash(req)

    # Known case with an empty body:
    # - image upload: its using application/octet-stream header instead of json
    #   thus body-parser won't populate req.body
    data = _.hashCode JSON.stringify(req.body or {})

    key = "#{sessionId}:#{method}:#{url}"
    previousData = requestsCache[key]

    if data is previousData
      return error_.bundle req, res, 'duplicated request', 429, [ key, req.body ]

    temporaryLock key, data

    if debug then _.log req.body, "#{method}:#{url} body"

    next()

headersHash = (req)-> _.hashCode JSON.stringify(req.headers)

temporaryLock = (key, data)->
  requestsCache[key] = data
  # _.log key, 'preventing duplicated request for the next 2 secondes'
  # unlock after 2 secondes
  unlock = -> requestsCache[key] = null
  setTimeout unlock, 2000

# can be problematic in cluster mode as it won't be shared between instances
requestsCache = {}

methodsWithBody = [ 'POST', 'PUT' ]
ignorePathname = [
  '/api/reports'
]
