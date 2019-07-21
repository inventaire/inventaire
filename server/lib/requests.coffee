CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
randomString = require('./utils/random_string').bind(null, 8)
{ repository } = __.require('root', 'package.json')
userAgent = "#{CONFIG.name} (#{repository.url})"

req = (verb)-> (url, options)->
  key = startTimer verb, url

  breq[verb] mergeOptions(url, options)
  .get 'body'
  .finally _.EndTimer(key)

head = (url, options)->
  key = startTimer 'head', url

  breq.head mergeOptions(url, options)
  .then (res)-> _.pick res, [ 'statusCode', 'headers' ]
  .finally _.EndTimer(key)

baseOptions =
  headers:
    # Default to JSON
    accept: 'application/json'
    # A user agent is required by Wikimedia services
    # (reject with a 403 error otherwise)
    'user-agent': userAgent

# merge options to fit the 'request' lib interface
# which is wrapped by bluereq
mergeOptions = (url, options = {})->
  # accept to get the url in the options
  if _.isObject url
    options = url
    url = null

  # If the url was in the options
  # the url object will be overriden
  return _.extend { url }, baseOptions, options

startTimer = (verb, url)->
  # url could be an object
  url = JSON.stringify url
    # Prevent logging Basic Auth credentials
    .replace /\/\/\w+:[^@:]+@/, '//'

  return _.startTimer "#{verb.toUpperCase()} #{url} [#{randomString()}]"

module.exports =
  get: req 'get'
  post: req 'post'
  put: req 'put'
  delete: req 'delete'
  head: head
