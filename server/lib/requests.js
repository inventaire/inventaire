const CONFIG = require('config')
const __ = CONFIG.universalPath
const { logOutgoingRequests } = CONFIG
const assert_ = __.require('utils', 'assert_types')
const fetch = require('node-fetch')
const error_ = __.require('lib', 'error/error')
const { addContextToStack } = error_
const { magenta } = require('chalk')
const { repository } = __.require('root', 'package.json')
const userAgent = `${CONFIG.name} (${repository.url})`
const { getAgent, selfSignedHttpsAgent } = require('./requests_agent')
// Setting the default timeout low
const defaultTimeout = 10 * 1000

let requestId = 0

const req = method => async (url, options = {}) => {
  assert_.string(url)
  assert_.object(options)

  const { returnBodyOnly = true, parseJson = true, body: reqBody } = options
  // Removing options that don't concern node-fetch
  delete options.returnBodyOnly
  delete options.parseJson

  completeOptions(method, options)

  let reqTimerKey
  if (logOutgoingRequests) reqTimerKey = startReqTimer(method, url, options)
  const res = await fetch(url, options)
  if (logOutgoingRequests) endReqTimer(reqTimerKey)

  const { status: statusCode } = res

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
      // Known case: CouchDB returns errors as plain text by default
      // Let the error be raised as a request error instead of a JSON.parse error
      if (statusCode < 400) {
        err.context = { url, options, statusCode, responseText }
        addContextToStack(err)
        throw err
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
  const reqTimerKey = startReqTimer('head', url, options)
  const { status, headers } = await fetch(url, options)
  endReqTimer(reqTimerKey)
  return {
    statusCode: status,
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
  if (options.selfSigned) {
    options.agent = selfSignedHttpsAgent
  } else {
    options.agent = getAgent
  }
}

const basicAuthPattern = /\/\/\w+:[^@:]+@/
const startReqTimer = (method, url, options) => {
  // Prevent logging Basic Auth credentials
  url = url.replace(basicAuthPattern, '//')

  let body = ' '
  if (options.bodyStream) body += '[stream]'
  else if (options && options.body) body += options.body

  const reqTimerKey = magenta(`${method.toUpperCase()} ${url}${body} [r${++requestId}]`)
  console.time(reqTimerKey)
  return reqTimerKey
}

const endReqTimer = console.timeEnd

module.exports = {
  get: req('get'),
  post: req('post'),
  put: req('put'),
  delete: req('delete'),
  head,
  userAgent
}
