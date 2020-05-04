const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
const fetch = require('node-fetch')
const { magenta } = require('chalk')
const { repository } = __.require('root', 'package.json')
const userAgent = `${CONFIG.name} (${repository.url})`
const { Agent: HttpAgent } = require('http')
const { Agent: HttpsAgent } = require('https')
const httpAgent = new HttpAgent({ keepAlive: true })
const httpsAgent = new HttpsAgent({ keepAlive: true })
// Using a custom agent to set keepAlive=true
// https://nodejs.org/api/http.html#http_class_http_agent
// https://github.com/bitinn/node-fetch#custom-agent
const getAgent = ({ protocol }) => protocol === 'http:' ? httpAgent : httpsAgent

let requestId = 0

const req = method => async (url, options = {}) => {
  assert_.string(url)
  assert_.object(options)

  completeOptions(method, options)

  const reqTimerKey = startReqTimer(method, url, options)
  const res = await fetch(url, options)
  endReqTimer(reqTimerKey)

  const { status: statusCode } = res

  // Always parse as text, even if JSON, as in case of an error in the JSON response
  // (such as HTML being retunred instead of JSON), it allows to include the actual response
  // in the error message
  // It shouldn't have any performance cost, as that's what node-fetch does in the background anyway
  const responseText = await res.text()

  let body
  if (options.headers.accept === 'application/json') {
    try {
      body = JSON.parse(responseText)
    } catch (err) {
      err.context = { url, options, statusCode, responseText }
      throw err
    }
  } else {
    body = responseText
  }

  if (statusCode >= 400) throw requestError(res, method, url, body)
  else return body
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
  }

  options.timeout = options.timeout || 60 * 1000
  options.compress = true
  options.agent = getAgent
}

const basicAuthPattern = /\/\/\w+:[^@:]+@/
const startReqTimer = (method, url, options) => {
  // Prevent logging Basic Auth credentials
  url = url.replace(basicAuthPattern, '//')

  let body = ' '
  if (options && options.body) body += options.body

  const reqTimerKey = magenta(`${method.toUpperCase()} ${url}${body} [r${++requestId}]`)
  console.time(reqTimerKey)
  return reqTimerKey
}

const endReqTimer = console.timeEnd

const requestError = async (res, method, url, body) => {
  const err = new Error('request error')
  let resBody = await res.text()
  if (resBody[0] === '{') resBody = JSON.parse(resBody)
  err.statusCode = res.status
  err.context = { method, url, reqBody: body, resBody }
  return err
}

module.exports = {
  get: req('get'),
  post: req('post'),
  put: req('put'),
  delete: req('delete'),
  head,
  userAgent
}
