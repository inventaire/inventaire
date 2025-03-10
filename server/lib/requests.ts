import { URL } from 'node:url'
// Reasons to use node-fetch rather than the native fetch:
// - accepts a custom agent (see https://github.com/nodejs/undici/issues/1489)
// Reasons to use node-fetch@2
// - accepts a timeout parameter
import fetch from 'node-fetch'
import { magenta, green, cyan, yellow, red, grey } from 'tiny-chalk'
import { newError, addContextToStack } from '#lib/error/error'
import type { ContextualizedError } from '#lib/error/format_error'
import { newInvalidError } from '#lib/error/pre_filled'
import { softwareName, version } from '#lib/package'
import { wait } from '#lib/promises'
import { assertObject, assertString } from '#lib/utils/assert_types'
import { arrayIncludes, truncateString } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import config, { publicOrigin } from '#server/config'
import type { AbsoluteUrl, HighResolutionTime, Host, HttpHeaders, HttpMethod } from '#types/common'
import { isUrl, isPositiveIntegerString } from './boolean_validations.js'
import { isPrivateUrl } from './network/is_private_url.js'
import { getAgent, insecureHttpsAgent } from './requests_agent.js'
import { assertHostIsNotTemporarilyBanned, resetBanData, declareHostError, conditionallyDeclareHostError } from './requests_temporary_host_ban.js'
import { coloredElapsedTime } from './time.js'
import type { Agent } from 'node:http'
import type { Stream } from 'node:stream'
import type OAuth from 'oauth-1.0a'

const { logStart, logEnd, logOngoingAtInterval, ongoingRequestLogInterval, bodyLogLimit, retryDelayBase } = config.outgoingRequests

const { NODE_APP_INSTANCE: nodeAppInstance = 'default' } = process.env
const { env } = config
export const userAgent = env.includes('tests')
  ? `${env}-${nodeAppInstance}`
  : `${softwareName}/${version}; +${publicOrigin}`

const defaultTimeout = 30 * 1000

let requestCount = 0

const retryableErrors = [
  // Thrown by node when re-using a socket that was closed by the other side
  // See https://medium.com/ssense-tech/reduce-networking-errors-in-nodejs-23b4eb9f2d83
  'ECONNRESET',
  // Thrown by node-fetch. It can happen when the maxSockets limit is reached.
  // See https://github.com/node-fetch/node-fetch/issues/1576#issuecomment-1694418865
  'ERR_STREAM_PREMATURE_CLOSE',
  'HPE_INVALID_CHUNK_SIZE',
  'EPIPE',
] as const

export interface RequestOptions {
  returnBodyOnly?: boolean
  parseJson?: boolean
  body?: unknown
  bodyStream?: Stream
  headers?: HttpHeaders | OAuth.Header
  noRetry?: boolean
  timeout?: number
  noHostBanOnTimeout?: boolean
  ignoreCertificateErrors?: boolean
  redirect?: 'follow' | 'error' | 'manual'
  attempts?: number
}

export async function request (method: HttpMethod, url: AbsoluteUrl, options: RequestOptions = {}) {
  assertString(url)
  assertObject(options)

  const { host } = new URL(url)
  assertHostIsNotTemporarilyBanned(host)
  if (hostHadTooManyRequests[host] != null) await waitForHostToAcceptNewRequests(host, method, url)

  const { returnBodyOnly = true, parseJson = true, body: reqBody, noRetry = false, noHostBanOnTimeout = false } = options
  const attempts = (options.attempts || 0) + 1
  const fetchOptions = getFetchOptions(method, options)

  const timer = startReqTimer(method, url, fetchOptions)

  let res, statusCode, errorName
  try {
    res = await fetch(url, fetchOptions)
  } catch (err) {
    errorName = err.code || err.type || err.name || err.message
    if (!noRetry && retryableErrors.includes(err.code) && attempts < 10) {
      await wait(retryDelayBase * attempts ** 2)
      warn(err, `retrying request ${timer.requestId} (attempts: ${attempts})`)
      return request(method, url, { ...options, attempts })
    } else {
      throw handleFetchError(err, method, url, host, noHostBanOnTimeout)
    }
  } finally {
    statusCode = res?.status
    endReqTimer(timer, statusCode || errorName)
  }

  let responseText
  try {
    // Always parse as text, even if JSON, as in case of an error in the JSON response
    // (such as HTML being retunred instead of JSON), it allows to include the actual response
    // in the error message
    // It shouldn't have any performance cost, as that's what node-fetch does in the background anyway
    responseText = await res.text()
  } catch (err) {
    if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return request(method, url, { ...options, attempts })
    else throw err
  }

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
        err.context = {
          url,
          options,
          statusCode,
          body: looksLikeHtml(responseText) ? '[HTML response body]' : responseText,
        }
        addContextToStack(err)
        declareHostError(host)
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
    if (statusCode >= 500) declareHostError(host)
    if (statusCode === 429) {
      const retryAfter = parseRetryAfterHeader(res)
      warn(url, `retrying request ${timer.requestId} in ${retryAfter}s (attempts: ${attempts})`)
      const waiting = hostHadTooManyRequests[host] = wait(retryAfter * 1000)
      await waiting
      if (hostHadTooManyRequests[host] === waiting) delete hostHadTooManyRequests[host]
      return request(method, url, { ...options, attempts })
    }
    const resBody = looksLikeHtml(body) ? '[HTML response body]' : body
    const err = newError('request error', statusCode, { method, url, reqBody, statusCode, resBody })
    err.body = resBody
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

function handleFetchError (err: ContextualizedError, method: HttpMethod, url: AbsoluteUrl, host: Host, noHostBanOnTimeout: boolean) {
  conditionallyDeclareHostError(host, err, { noHostBanOnTimeout })
  err.context = { method, url }
  return err
}

const looksLikeHtml = body => typeof body === 'string' && (body.trim().startsWith('<') || body.includes('<head>'))

function parseRetryAfterHeader (res) {
  const retryAfter = res.headers.get('retry-after')
  if (isPositiveIntegerString(retryAfter)) return parseInt(retryAfter)
}

export async function sanitizeUrl (url: unknown) {
  if (!isUrl(url) || (await isPrivateUrl(url))) {
    throw newInvalidError('url', url)
  }
  // Async assertion, waiting for https://github.com/microsoft/typescript/issues/37681
  return url as AbsoluteUrl
}

function formatHeaders (headers) {
  const flattenedHeaders = {}
  Object.keys(headers).forEach(key => {
    flattenedHeaders[key] = headers[key].join(';')
  })
  return flattenedHeaders
}

interface FetchOptions {
  method: string
  headers: Record<string, string>
  body?: unknown
  agent?: Agent | typeof getAgent
  redirect: 'follow' | 'error' | 'manual'
  compress: boolean
  // Non-standard: node-fetch@2 only
  timeout?: number
}

function getFetchOptions (method, options) {
  const headers = options.headers || {}
  const fetchOptions: FetchOptions = {
    method,
    headers,
    timeout: options.timeout || defaultTimeout,
    redirect: options.redirect,
    compress: true,
  }
  headers.accept = headers.accept || 'application/json'
  // A user agent is required by Wikimedia services
  // (reject with a 403 error otherwise)
  headers['user-agent'] = userAgent

  if (options.body && typeof options.body !== 'string') {
    fetchOptions.body = JSON.stringify(options.body)
    headers['content-type'] = 'application/json'
  } else if (options.bodyStream != null) {
    // Pass stream bodies as a 'bodyStream' option to avoid having it JSON.stringified
    fetchOptions.body = options.bodyStream
  } else {
    fetchOptions.body = options.body
  }

  if (options.ignoreCertificateErrors) {
    fetchOptions.agent = insecureHttpsAgent
  } else {
    fetchOptions.agent = getAgent
  }
  return fetchOptions
}

const basicAuthPattern = /\/\/\w+:[^@:/]+@/

const requestIntervalLogs = {}

export interface RequestTimer {
  reqTimerKey: string
  requestId: `r${number}`
  startTime: HighResolutionTime
}

export function startReqTimer (method = 'get', url, fetchOptions) {
  // Prevent logging Basic Auth credentials
  url = url.replace(basicAuthPattern, '//')

  let body = ''
  if (fetchOptions.bodyStream) body += ' [stream]'
  else if (typeof fetchOptions.body === 'string') {
    const { length } = fetchOptions.body
    if (length < bodyLogLimit) body += ' ' + fetchOptions.body
    else body += ` ${fetchOptions.body.slice(0, bodyLogLimit)} [${length} total characters...]`
  }

  const requestId = `r${++requestCount}`
  const reqTimerKey = `${method.toUpperCase()} ${url}${body.trimEnd()} [${requestId}]`
  const startTime = process.hrtime()
  if (logStart) process.stdout.write(`${grey(`${reqTimerKey} started`)}\n`)
  if (logOngoingAtInterval) startLoggingRequestAtInterval({ requestId, reqTimerKey, startTime })
  return { reqTimerKey, requestId, startTime } as RequestTimer
}

function startLoggingRequestAtInterval ({ requestId, reqTimerKey, startTime }) {
  requestIntervalLogs[requestId] = setInterval(() => {
    const elapsed = coloredElapsedTime(startTime)
    process.stdout.write(`${grey(`${reqTimerKey} ongoing`)} ${elapsed}\n`)
  }, ongoingRequestLogInterval)
}

function stopLoggingRequestAtInterval (requestId) {
  clearInterval(requestIntervalLogs[requestId])
  delete requestIntervalLogs[requestId]
}

export function endReqTimer ({ reqTimerKey, requestId, startTime, processingResponseStream = false }, statusCode) {
  if (logOngoingAtInterval) stopLoggingRequestAtInterval(requestId)
  if (!logEnd) return
  let elapsed = coloredElapsedTime(startTime)
  if (processingResponseStream) elapsed += yellow(' streaming')
  const statusColor = getStatusColor(statusCode)
  process.stdout.write(`${magenta(reqTimerKey)} ${statusColor(statusCode)} ${elapsed}\n`)
}

function getStatusColor (statusCode) {
  if (typeof statusCode !== 'number') return red
  if (statusCode < 300) return green
  if (statusCode < 400) return cyan
  if (statusCode < 500) return yellow
  return red
}

export const requests_ = {
  get: request.bind(null, 'get'),
  post: request.bind(null, 'post'),
  put: request.bind(null, 'put'),
  delete: request.bind(null, 'delete'),
  head: (url: AbsoluteUrl, options: RequestOptions = {}) => {
    options.parseJson = false
    options.returnBodyOnly = false
    return request('head', url, options)
  },
  options: request.bind(null, 'options'),
  userAgent,
}

export const get = requests_.get

const methodWithBody = [ 'put', 'post' ] as const

export function httpMethodHasBody (method: HttpMethod | Uppercase<HttpMethod>) {
  return arrayIncludes(methodWithBody, method.toLowerCase())
}

const hostHadTooManyRequests: Record<Host, Promise<void>> = {}

async function waitForHostToAcceptNewRequests (host: Host, method: HttpMethod, url: AbsoluteUrl) {
  warn(`waiting for hosts to accept new requests (${method} ${truncateString(url, 80)})`)
  await hostHadTooManyRequests[host]
  await wait(1000)
  if (hostHadTooManyRequests[host] != null) return waitForHostToAcceptNewRequests(host, method, url)
}
