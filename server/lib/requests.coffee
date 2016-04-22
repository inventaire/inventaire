__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'

req = (verb, url, options)->
  breq[verb] mergeOptions(url, options)
  .then _.property('body')
  .catch formatErr

head = (url, options)->
  breq.head mergeOptions(url, options)
  .then (res)-> _.pick res, ['statusCode', 'headers']
  .catch formatErr

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

module.exports =
  get: _.partial req, 'get'
  post: _.partial req, 'post'
  put: _.partial req, 'put'
  delete: _.partial req, 'delete'
  head: head
