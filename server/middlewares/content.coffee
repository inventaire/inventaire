CONFIG = require 'config'
{ debug } = CONFIG
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

urlencoded = 'application/x-www-form-urlencoded'

module.exports =
  # Helping body-parser to get its parsing right
  redirectContentTypes: (req, res, next)->
    if req.headers['content-type'] is 'application/csp-report'
      req.headers['content-type'] = 'application/json'

    next()

  # When passed content with a content-type header different
  # from 'application/json' (typically urlencoded which is set by default on
  # tools like curl), this tries to be convenient by recovering the passed json
  # instead of returning an unhelpful error messages
  # /!\ To be used only in development as it exposes to CSRF
  # cf https://github.com/pillarjs/understanding-csrf#adding-them-to-json-ajax-calls
  # http://stackoverflow.com/a/11024387/3324977
  recoverJsonUrlencoded: (req, res, next)->
    if req.headers['content-type'] isnt urlencoded then return next()

    keys = Object.keys req.body

    # keeping the case when req.body was parsed by body-parser as something like:
    # { '{"a":"b", "c":null}': '' }
    if keys.length isnt 1 or keys[0][0..1] isnt '{"' then return next()

    # if keys.length isnt 1 or req.body[keys[0]] isnt '' then return next()

    # try to parse what should be a valid json object
    try
      req.body = JSON.parse keys[0]
      next()
    # if it doesn't work, let it go
    catch err
      error_.bundle req, res, """
        Couldn't recover JSON data sent with "Content-Type: #{urlencoded}".
        Try using a "Content-Type: application/json" header instead
        """, 400

  # Assumes that a requests made twice with the same body within 2 secondes
  # is an erronous request that should be blocked
  deduplicateRequests: (req, res, next)->
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
      return error_.bundle req, res, 'duplicated request', 429, [key, req.body]

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
