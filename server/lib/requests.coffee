__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
chalk = require 'chalk'

req = (verb, url, options)->
  key = startTime verb, url

  breq[verb] mergeOptions(url, options)
  .get 'body'
  .catch formatErr
  .finally EndTimer(key)

head = (url, options)->
  key = startTime 'head', url

  breq.head mergeOptions(url, options)
  .then (res)-> _.pick res, ['statusCode', 'headers']
  .catch formatErr
  .finally EndTimer(key)

# default to JSON
baseOptions =
  headers:
    accept: 'application/json'

# merge options to fit the 'request' lib interface
# which is wrapped by bluereq
mergeOptions = (url, options={})->
  # accept to get the url in the options
  if _.isObject url
    options = url
    url = null

  # if the url was in the options
  # the url object will be overriden
  _.extend {url: url}, baseOptions, options,

formatErr = (err)->
  # aliasing statusCode to match lib/error filter system
  err.status = err.statusCode
  throw err

startTime = (verb, url)->
  # Use a random string so that dupplicated request don't mixup their timers
  randomStr = Math.random().toString(36).slice(2, 10)
  key = chalk.magenta "#{verb.toUpperCase()} #{url} (#{randomStr})"
  console.time key
  return key

EndTimer = (key)-> ()-> console.timeEnd key

module.exports =
  get: _.partial req, 'get'
  post: _.partial req, 'post'
  put: _.partial req, 'put'
  delete: _.partial req, 'delete'
  head: head
