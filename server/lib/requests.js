const CONFIG = require('config')
const { log: logOutgoingRequests, bodyLogLimit } = CONFIG.outgoingRequests
const assert_ = require('lib/utils/assert_types')
const { wait } = require('lib/promises')
const fetch = require('node-fetch')
const error_ = require('lib/error/error')
const { addContextToStack } = error_
const { magenta, green, cyan, yellow, red } = require('chalk')
const { repository } = require('root/package.json')
const userAgent = `${CONFIG.name} (${repository.url})`
const { getAgent, insecureHttpsAgent } = require('./requests_agent')
const { throwIfTemporarilyBanned, resetBanData, declareHostError } = require('./requests_temporary_host_ban')
const { URL } = require('url')
const { coloredElapsedTime } = require('./time')
const { isUrl } = require('./boolean_validations')
const { isRestrictedHost } = require('./network')
const defaultTimeout = 30 * 1000

const req = method => async (url, options = {}) => {
  assert_.string(url)
  assert_.object(options)

  if (options.sanitize) {
    if (!isUrl(url) && await isRestrictedHost(url)) {
      throw error_.newInvalid('url', url)
    }
  }

  const { host } = new URL(url)
  throwIfTemporarilyBanned(host)

  const { returnBodyOnly = true, parseJson = true, body: reqBody } = options
  // Removing options that don't concern node-fetch
  delete options.returnBodyOnly
  delete options.parseJson

  completeOptions(method, options)

  const timer = startReqTimer(method, url, options)

  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    if (err.code === 'ECONNRESET') {
      // Retry after a short delay when socket hang up
      await wait(100)
      res = await fetch(url, options)
    } else {
      if (err.type === 'request-timeout' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') declareHostError(host)
      throw err
    }
  }

  const { status: statusCode } = res

  endReqTimer(timer, statusCode)

  // Always parse as text, even if JSON, as in case of an error in the JSON response
  // (such as HTML being retunred instead of JSON), it allows to include the actual response
  // in the error message
  // It shouldn't have any performance cost, as that's what node-fetch does in the background anyway
  const responseText = await res.text()

  let body
  if (parseJson) {
    try {
      body = JSON.parse(responseText)
    } catch (err) {
      // Some web services return errors with a different content-type
      // Known cases:
      // - CouchDB returns errors as plain text by default
      // - SPARQL services too
      // Let the error be raised as a request error instead of a JSON.parse error
      if (statusCode < 400) {
        err.context = { url, options, statusCode, responseText }
        addContextToStack(err)
        throw err
      } else {
        // Above 400, let it be raised as a request error hereafter
        body = responseText
      }
    }
  } else {
    body = responseText
  }

  if (statusCode >= 400) {
    const err = error_.new('request error', statusCode, { method, url, reqBody, statusCode, resBody: body })
    err.body = body
    addContextToStack(err)
    throw err
  }

  resetBanData(host)

  if (returnBodyOnly) {
    return body
  } else {
    const headers = formatHeaders(res.headers.raw())
    return { statusCode, headers, body }
  }
}

// Same but doesn't parse response
const head = async (url, options = {}) => {
  completeOptions('head', options)
  const timer = startReqTimer('head', url, options)
  const { status: statusCode, headers } = await fetch(url, options)
  endReqTimer(timer, statusCode)
  return {
    statusCode,
    headers: formatHeaders(headers.raw())
  }
}

const formatHeaders = headers => {
  const flattenedHeaders = {}
  Object.keys(headers).forEach(key => {
    flattenedHeaders[key] = headers[key].join(';')
  })
  return flattenedHeaders
}

const completeOptions = (method, options) => {
  options.method = method
  options.headers = options.headers || {}
  options.headers.accept = options.headers.accept || 'application/json'
  // A user agent is required by Wikimedia services
  // (reject with a 403 error otherwise)
  options.headers['user-agent'] = userAgent

  if (options.body && typeof options.body !== 'string') {
    options.body = JSON.stringify(options.body)
    options.headers['content-type'] = 'application/json'
  } else if (options.bodyStream) {
    // Pass stream bodies as a 'bodyStream' option to avoid having it JSON.stringified
    options.body = options.bodyStream
  }

  options.timeout = options.timeout || defaultTimeout
  options.compress = true
  if (options.ignoreCertificateErrors) {
    options.agent = insecureHttpsAgent
  } else {
    options.agent = getAgent
  }
}

const basicAuthPattern = /\/\/\w+:[^@:]+@/
const startReqTimer = (method, url, options) => {
  // Prevent logging Basic Auth credentials
  url = url.replace(basicAuthPattern, '//')

  let body = ''
  if (options.bodyStream) body += ' [stream]'
  else if (options && options.body) {
    const { length } = options.body
    if (length < bodyLogLimit) body += ' ' + options.body
    else body += ` ${options.body.slice(0, bodyLogLimit)} [${length} total characters...]`
  }

  const reqTimerKey = `${method.toUpperCase()} ${url}${body}`
  const startTime = process.hrtime()
  return [ reqTimerKey, startTime ]
}

const endReqTimer = ([ reqTimerKey, startTime ], statusCode) => {
  if (!logOutgoingRequests) return
  const elapsed = coloredElapsedTime(startTime)
  const statusColor = getStatusColor(statusCode)
  process.stdout.write(`${magenta(reqTimerKey)} ${statusColor(statusCode)} ${elapsed}\n`)
}

const getStatusColor = statusCode => {
  if (statusCode < 300) return green
  if (statusCode < 400) return cyan
  if (statusCode < 500) return yellow
  return red
}

module.exports = {
  get: req('get'),
  post: req('post'),
  put: req('put'),
  delete: req('delete'),
  head,
  options: req('options'),
  userAgent
}
