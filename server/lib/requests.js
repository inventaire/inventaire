const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const breq = require('bluereq')
const { repository } = __.require('root', 'package.json')
const userAgent = `${CONFIG.name} (${repository.url})`
let requestId = 0

const req = verb => (url, options) => {
  const key = startTimer(verb, url)

  return breq[verb](mergeOptions(url, options))
  .then(({ body }) => body)
  .finally(_.EndTimer(key))
}

const head = (url, options) => {
  const key = startTimer('head', url)

  return breq.head(mergeOptions(url, options))
  .then(res => _.pick(res, [ 'statusCode', 'headers' ]))
  .finally(_.EndTimer(key))
}

const baseOptions = {
  headers: {
    // Default to JSON
    accept: 'application/json',
    // A user agent is required by Wikimedia services
    // (reject with a 403 error otherwise)
    'user-agent': userAgent
  }
}

// merge options to fit the 'request' lib interface
// which is wrapped by bluereq
const mergeOptions = (url, options = {}) => {
  // accept to get the url in the options
  if (_.isObject(url)) {
    options = url
    url = null
  }

  // If the url was in the options
  // the url object will be overriden
  return Object.assign({ url }, baseOptions, options)
}

const basicAuthPattern = /\/\/\w+:[^@:]+@/
const startTimer = (verb, url) => {
  // url could be an object
  url = JSON.stringify(url)
    // Prevent logging Basic Auth credentials
    .replace(basicAuthPattern, '//')

  return _.startTimer(`${verb.toUpperCase()} ${url} [r${++requestId}]`)
}

module.exports = {
  get: req('get'),
  post: req('post'),
  put: req('put'),
  delete: req('delete'),
  head,
  userAgent
}
