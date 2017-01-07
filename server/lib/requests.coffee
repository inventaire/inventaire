__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
chalk = require 'chalk'

req = (verb, url, options)->
  key = startTimer verb, url

  breq[verb] mergeOptions(url, options)
  .get 'body'
  .catch formatErr
  .finally _.EndTimer(key)

head = (url, options)->
  key = startTimer 'head', url

  breq.head mergeOptions(url, options)
  .then (res)-> _.pick res, ['statusCode', 'headers']
  .catch formatErr
  .finally _.EndTimer(key)

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

startTimer = (verb, url)->
  # url could be an object
  url = JSON.stringify url
  key = "#{verb.toUpperCase()} #{url} [#{_.randomString()}]"
  return _.startTimer key

module.exports =
  get: _.partial req, 'get'
  post: _.partial req, 'post'
  put: _.partial req, 'put'
  delete: _.partial req, 'delete'
  head: head
